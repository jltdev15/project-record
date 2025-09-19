export interface Document {
  id: string;
  title: string;
  description: string;
  date: string;
  documentType: string;
  referenceNumber: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  storagePath: string; // Add this field to store the actual storage path
  content?: string; // Extracted text content for search
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface UploadProgress {
  progress: number;
  state: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

export interface SearchFilters {
  title: string;
  referenceNumber: string;
  documentType: string;
  dateFrom: string;
  dateTo: string;
} 