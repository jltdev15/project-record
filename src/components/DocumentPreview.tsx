import React from 'react';
import QRCode from 'react-qr-code';
import { Document } from '../types';
import QRCodeLib from 'qrcode';

interface DocumentPreviewProps {
  document: Document;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePrint = async () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      try {
        // Generate proper QR code with document URL
        const qrCodeDataURL = await QRCodeLib.toDataURL(document.fileUrl, {
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${document.title} - Document with QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
              }
              .document-container {
                position: relative;
                max-width: 100%;
                margin: 0 auto;
                background: white;
              }
              .document-content {
                width: 100%;
                height: auto;
                border: 1px solid #ddd;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .qr-overlay {
                position: absolute;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 5px;
                border: 1px solid #000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .qr-code {
                display: block;
              }
              .document-info {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.9);
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                max-width: 200px;
              }
              .info-row {
                margin-bottom: 5px;
              }
              .label {
                font-weight: bold;
                font-size: 10px;
              }
              .value {
                font-size: 10px;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .document-container { box-shadow: none; }
                .qr-overlay { 
                  position: absolute !important;
                  bottom: 20px !important;
                  right: 20px !important;
                }
                .document-info {
                  position: absolute !important;
                  top: 20px !important;
                  left: 20px !important;
                }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="document-container">
              <div class="document-info">
                <div class="info-row">
                  <span class="label">Ref:</span>
                  <span class="value">${document.referenceNumber}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date:</span>
                  <span class="value">${formatDate(document.date)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Type:</span>
                  <span class="value">${document.documentType}</span>
                </div>
              </div>
              
              <div class="document-content">
                ${document.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? 
                  `<img src="${document.fileUrl}" alt="${document.title}" style="width: 100%; height: auto; display: block;" />` :
                  `<iframe src="${document.fileUrl}" style="width: 100%; height: 80vh; border: none;" title="${document.title}"></iframe>`
                }
              </div>
              
              <div class="qr-overlay">
                <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code" />
              </div>
            </div>
            
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Document</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate print preview. Please try again.');
      }
    }
  };

  const isImage = document.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
  
  // Debug information
  console.log('Document preview debug:', {
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    isImage: isImage,
    fileType: document.fileName.split('.').pop()?.toLowerCase()
  });

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Document Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Document Preview</h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {document.documentType}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formatFileSize(document.fileSize)}
                  </span>
                </div>
              </div>
              
              {isImage ? (
                <div className="relative group">
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-50">
                    <div className="flex items-center justify-center min-h-[200px]">
                      <img
                        src={document.fileUrl}
                        alt={document.title}
                        className="max-w-full max-h-96 w-auto h-auto"
                        onError={(e) => {
                          console.error('Image failed to load:', document.fileUrl);
                          e.currentTarget.style.display = 'none';
                          // Show fallback content
                          const fallback = e.currentTarget.parentElement?.parentElement?.querySelector('.image-fallback');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', document.fileUrl);
                          console.log('Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
                          console.log('Image display style:', e.currentTarget.style.display);
                        }}
                      />
                    </div>
                    {/* Fallback for failed image loads */}
                    <div className="image-fallback hidden absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">Image could not be loaded</p>
                        <p className="text-gray-400 text-xs mt-1">{document.fileName}</p>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-900 truncate">{document.fileName}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)} • PDF Document</p>
                    </div>
                    <div className="flex-shrink-0">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#800000] hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open PDF
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#800000] hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Document Record
                </button>
              </div>
            </div>

            {/* Document Details with QR Code */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Document Information</h3>
                <div className="text-sm text-gray-500">
                  Ref: {document.referenceNumber}
                </div>
              </div>
              
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-6 shadow-lg">
                <div className="text-center pb-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
                  <p className="text-sm text-gray-600">Document Reference: {document.referenceNumber}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{document.description || 'No description provided'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
                        <p className="text-sm text-gray-900">{document.documentType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                        <p className="text-sm text-gray-900">{formatDate(document.date)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">File Name</label>
                        <p className="text-sm text-gray-900 truncate">{document.fileName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">File Size</label>
                        <p className="text-sm text-gray-900">{formatFileSize(document.fileSize)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Date</label>
                        <p className="text-sm text-gray-900">{formatDate(document.uploadedAt)}</p>
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                        <QRCode
                          value={document.fileUrl}
                          size={120}
                          level="H"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 font-medium">Scan to access document</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview; 