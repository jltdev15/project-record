import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DocumentService } from '../services/documentService';
import { UploadProgress } from '../types';

const UploadForm: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    documentType: '',
    referenceNumber: ''
  });

  const documentTypes = [
    'Syllabus',
    'Class Program',
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type - now including Word and Excel files
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF, JPG, PNG, Word (.doc/.docx), or Excel (.xls/.xlsx) file.');
        return;
      }
      setSelectedFile(file);
      
      // Reset OCR state when new file is selected
      setIsProcessingOCR(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress({ progress: 0, state: 'pending' });

    // Check if file is likely to need OCR processing (but don't show modal yet)
    const isLargePDF = selectedFile.type === 'application/pdf' && selectedFile.size > 10 * 1024 * 1024; // 10MB+
    const isImage = selectedFile.type.startsWith('image/');
    const needsOCR = isLargePDF || isImage;

    try {
      await DocumentService.uploadDocument(
        selectedFile,
        formData,
        { uid: user.uid, displayName: user.displayName },
        (progress) => {
          setUploadProgress(progress);
          // Show OCR modal when upload reaches 100% and file needs OCR
          if (progress.progress >= 100 && needsOCR) {
            setIsProcessingOCR(true);
          }
        }
      );

      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        documentType: '',
        referenceNumber: ''
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setIsProcessingOCR(false);
    }
  };

  return (
    <>
      {/* OCR Processing Modal Overlay */}
      {isProcessingOCR && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing Document
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Extracting text from your document. Please wait...
              </p>
              <p className="text-sm text-blue-600 font-medium mb-4">
                Estimated time: 3-5 minutes
              </p>
              <p className="text-xs text-gray-500">
                Do not close this page during processing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Document</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Document (PDF, JPG, PNG, Word, Excel)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          {selectedFile && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              {(selectedFile.type === 'application/pdf' && selectedFile.size > 10 * 1024 * 1024) || selectedFile.type.startsWith('image/') ? (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        OCR Processing Required
                      </h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>This document will be processed with OCR (Optical Character Recognition) to extract searchable text.</p>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li>Processing time: 1-3 minutes</li>
                          <li>All pages will be analyzed</li>
                          <li>Multiple OCR passes for better accuracy</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Document Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number *
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select type</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

       

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {uploadProgress.state === 'running' && 'Uploading...'}
                {uploadProgress.state === 'success' && 'Upload Complete!'}
                {uploadProgress.state === 'error' && 'Upload Failed'}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(uploadProgress.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            {uploadProgress.error && (
              <p className="text-sm text-red-600 mt-2">{uploadProgress.error}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessingOCR ? 'Processing with OCR...' : isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
      </div>
    </>
  );
};

export default UploadForm; 