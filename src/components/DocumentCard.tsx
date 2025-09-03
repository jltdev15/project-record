import React, { useState } from 'react';
import { Document } from '../types';
import DocumentPreview from './DocumentPreview';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

interface DocumentCardProps {
  document: Document;
  onDelete: (document: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

const handleDownload = async () => {
  if (isDownloading) return;
  setIsDownloading(true);

  try {
    // Get a fresh download URL from Firebase Storage
    const storageRef = ref(storage, document.storagePath);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Open in new tab - this is more reliable than forcing download
    window.open(downloadURL, '_blank');
  } catch (error) {
    console.error("Download failed:", error);
    
    // Fallback to stored URL
    try {
      window.open(document.fileUrl, '_blank');
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      alert('Failed to open file. Please try again.');
    }
  } finally {
    setIsDownloading(false);
  }
};


  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(document.fileName)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {document.title}
              </h3>
              <p className="text-sm text-gray-500">
                Ref: {document.referenceNumber}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPreview(true)}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`p-1 transition-colors ${
                isDownloading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-green-600 hover:text-green-800'
              }`}
              title={isDownloading ? 'Downloading...' : 'Download'}
            >
              {isDownloading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => onDelete(document)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            {document.description || 'No description provided'}
          </p>
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {document.documentType}
            </span>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              {formatFileSize(document.fileSize)}
            </span>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Date: {formatDate(document.date)}</p>
            <p>Uploaded: {formatDate(document.uploadedAt)} by {document.uploadedBy}</p>
          </div>
        </div>
      </div>

      {showPreview && (
        <DocumentPreview
          document={document}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default DocumentCard; 