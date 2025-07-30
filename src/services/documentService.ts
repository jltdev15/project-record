import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, push, get, query, orderByChild, remove, update } from 'firebase/database';
import { storage, database, auth } from '../firebase/config';
import { Document, UploadProgress } from '../types';

export class DocumentService {
  // Upload document to Firebase Storage
  static async uploadDocument(
    file: File,
    metadata: Omit<Document, 'id' | 'fileUrl' | 'fileName' | 'fileSize' | 'uploadedAt' | 'uploadedBy'>,
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
            
            const documentData: Omit<Document, 'id'> = {
              ...metadata,
              fileUrl: downloadURL,
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
              uploadedBy: user.displayName
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

  // Delete document
  static async deleteDocument(document: Document): Promise<void> {
    // Delete from Storage
    const storageRef = ref(storage, `documents/${document.fileName}`);
    await deleteObject(storageRef);
    
    // Delete from Database
    const documentRef = dbRef(database, `documents/${document.id}`);
    await remove(documentRef);
  }

  // Update document metadata
  static async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const documentRef = dbRef(database, `documents/${id}`);
    await update(documentRef, updates);
  }
} 