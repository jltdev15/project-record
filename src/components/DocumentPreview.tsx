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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Document</h3>
              
              {isImage ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={document.fileUrl}
                    alt={document.title}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{document.fileName}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Open PDF
                    </a>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Print Document Record
                </button>
              </div>
            </div>

            {/* Document Details with QR Code */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
              
              <div id="pdf-content" className="bg-white border rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">{document.title}</h1>
                  <p className="text-sm text-gray-600">Reference: {document.referenceNumber}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{document.description || 'No description provided'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Document Type</label>
                      <p className="text-sm text-gray-900">{document.documentType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900">{formatDate(document.date)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">File Name</label>
                      <p className="text-sm text-gray-900">{document.fileName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">File Size</label>
                      <p className="text-sm text-gray-900">{formatFileSize(document.fileSize)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Uploaded By</label>
                      <p className="text-sm text-gray-900">{document.uploadedBy}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                      <p className="text-sm text-gray-900">{formatDate(document.uploadedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <div className="inline-block p-4 bg-white border rounded-lg">
                    <QRCode
                      value={document.fileUrl}
                      size={128}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scan to access document</p>
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