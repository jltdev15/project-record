import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UploadForm from './UploadForm';
import DocumentList from './DocumentList';
import ConfirmationModal from './ConfirmationModal';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'documents'>('documents');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#800000] to-[#600000] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  DHVS Document Management System
                </h1>
                <p className="text-red-100 text-sm">
                  Record Management System
                </p>
              </div>
            </div>
            
            {/* User Profile and Actions */}
            <div className="flex items-center space-x-6">
              {/* Welcome Message */}
              <div className="hidden md:block text-right">
                <p className="text-red-100 text-sm">Welcome back,</p>
                <p className="text-white font-medium">{user?.displayName}</p>
              </div>


              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'documents'
                  ? 'bg-red-50 text-[#800000] border-b-2 border-[#800000]'
                  : 'text-gray-600 hover:text-[#800000] hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Document Library</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'upload'
                  ? 'bg-red-50 text-[#800000] border-b-2 border-[#800000]'
                  : 'text-gray-600 hover:text-[#800000] hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' ? (
          <div className="max-w-2xl mx-auto">
            <UploadForm />
          </div>
        ) : (
          <DocumentList />
        )}
      </main>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        confirmColor="bg-[#800000] hover:bg-[#600000]"
      />
    </div>
  );
};

export default Dashboard; 