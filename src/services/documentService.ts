import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, push, get, query, orderByChild, remove, update } from 'firebase/database';
import { storage, database, auth } from '../firebase/config';
import { Document, UploadProgress } from '../types';

export class DocumentService {
  // Upload document to Firebase Storage
  static async uploadDocument(
    file: File,
    metadata: Omit<Document, 'id' | 'fileUrl' | 'fileName' | 'fileSize' | 'uploadedAt' | 'uploadedBy' | 'storagePath'>,
    user: { uid: string; displayName: string },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Debug: Check if user is authenticated
    console.log('Current user:', user);
    console.log('Auth state:', auth.currentUser);
    
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `documents/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      customMetadata: {
        'Access-Control-Allow-Origin': '*'
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            state: 'running'
          });
        },
        (error) => {
          onProgress?.({
            progress: 0,
            state: 'error',
            error: error.message
          });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Get the actual storage path from the Firebase Storage reference
            // The fullPath property gives us the path relative to the bucket root
            const actualStoragePath = uploadTask.snapshot.ref.fullPath;
            console.log('Upload completed. Storage path:', actualStoragePath);
            
            const documentData: Omit<Document, 'id'> = {
              ...metadata,
              fileUrl: downloadURL,
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
              uploadedBy: user.displayName,
              storagePath: actualStoragePath // Use the actual storage path from Firebase
            };

            const docRef = await push(dbRef(database, 'documents'), documentData);
            
            onProgress?.({
              progress: 100,
              state: 'success'
            });

            resolve(docRef.key!);
          } catch (error) {
            onProgress?.({
              progress: 0,
              state: 'error',
              error: 'Failed to save document metadata'
            });
            reject(error);
          }
        }
      );
    });
  }

  // Get all documents
  static async getDocuments(): Promise<Document[]> {
    const documentsRef = dbRef(database, 'documents');
    const snapshot = await get(documentsRef);
    
    if (snapshot.exists()) {
      const documents: Document[] = [];
      snapshot.forEach((childSnapshot) => {
        documents.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      return documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }
    
    return [];
  }

  // Search documents
  static async searchDocuments(filters: {
    title?: string;
    referenceNumber?: string;
    documentType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Document[]> {
    const documentsRef = dbRef(database, 'documents');
    let q = query(documentsRef, orderByChild('uploadedAt'));

    const snapshot = await get(q);
    
    if (!snapshot.exists()) return [];

    const documents: Document[] = [];
    snapshot.forEach((childSnapshot) => {
      const doc = { id: childSnapshot.key!, ...childSnapshot.val() };
      
      // Apply filters
      let matches = true;
      
      if (filters.title && !doc.title.toLowerCase().includes(filters.title.toLowerCase())) {
        matches = false;
      }
      
      if (filters.referenceNumber && !doc.referenceNumber.toLowerCase().includes(filters.referenceNumber.toLowerCase())) {
        matches = false;
      }
      
      if (filters.documentType && doc.documentType !== filters.documentType) {
        matches = false;
      }
      
      if (filters.dateFrom && new Date(doc.date) < new Date(filters.dateFrom)) {
        matches = false;
      }
      
      if (filters.dateTo && new Date(doc.date) > new Date(filters.dateTo)) {
        matches = false;
      }
      
      if (matches) {
        documents.push(doc);
      }
    });

    return documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  // Get document by ID
  static async getDocumentById(id: string): Promise<Document | null> {
    try {
      const documentRef = dbRef(database, `documents/${id}`);
      const snapshot = await get(documentRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.key!, ...snapshot.val() };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  // Get correct storage path for a document (for migration purposes)
  static getStoragePath(document: Document): string {
    if (document.storagePath) {
      return document.storagePath;
    }
    
    // Fallback: construct the path from fileName and uploadedAt
    const timestamp = document.uploadedAt ? new Date(document.uploadedAt).getTime() : Date.now();
    const sanitizedFileName = document.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `documents/${timestamp}_${sanitizedFileName}`;
  }

  // Migrate existing documents to include storagePath
  static async migrateDocuments(): Promise<void> {
    try {
      const documents = await this.getDocuments();
      const updates: Promise<void>[] = [];
      
      for (const document of documents) {
        if (!document.storagePath) {
          const storagePath = this.getStoragePath(document);
          updates.push(this.updateDocument(document.id, { storagePath }));
        }
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`Migrated ${updates.length} documents`);
      }
    } catch (error) {
      console.error('Error migrating documents:', error);
      throw error;
    }
  }

  // Verify if a storage path exists
  static async verifyStoragePath(storagePath: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, storagePath);
      await getDownloadURL(storageRef);
      return true;
    } catch (error) {
      console.log('Storage path verification failed:', storagePath, error);
      return false;
    }
  }

  // List all files in documents folder (for debugging)
  static async listStorageFiles(): Promise<string[]> {
    try {
      const listRef = ref(storage, 'documents');
      // Note: This requires Firebase Storage Rules to allow listing
      // For now, we'll just return an empty array if listing fails
      return [];
    } catch (error) {
      console.log('Cannot list storage files (likely due to security rules):', error);
      return [];
    }
  }

  // Delete document
  static async deleteDocument(document: Document): Promise<void> {
    try {
      // Delete from Storage using the correct storage path
      const storagePath = this.getStoragePath(document);
      console.log('Deleting document from storage:', {
        documentId: document.id,
        fileName: document.fileName,
        storagePath: storagePath,
        hasStoragePath: !!document.storagePath,
        originalStoragePath: document.storagePath,
        fullDocument: document
      });
      
      // Verify the storage path exists before attempting deletion
      const pathExists = await this.verifyStoragePath(storagePath);
      if (!pathExists) {
        console.warn('Storage path does not exist:', storagePath);
        // Try alternative paths
        const alternativePaths = [
          `documents/${document.fileName}`,
          `documents/${document.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          `documents/${document.id}_${document.fileName}`
        ];
        
        for (const altPath of alternativePaths) {
          console.log('Trying alternative path:', altPath);
          if (await this.verifyStoragePath(altPath)) {
            console.log('Found file at alternative path:', altPath);
            const storageRef = ref(storage, altPath);
            await deleteObject(storageRef);
            console.log('Successfully deleted from alternative path:', altPath);
            break;
          }
        }
      } else {
        const storageRef = ref(storage, storagePath);
        console.log('Storage reference created with path:', storageRef.fullPath);
        await deleteObject(storageRef);
        console.log('Successfully deleted from storage:', storagePath);
      }
      
      // Delete from Database
      const documentRef = dbRef(database, `documents/${document.id}`);
      await remove(documentRef);
      console.log('Successfully deleted from database:', document.id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Update document metadata
  static async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const documentRef = dbRef(database, `documents/${id}`);
    await update(documentRef, updates);
  }
} 