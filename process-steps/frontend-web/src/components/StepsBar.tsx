import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineRobot } from 'react-icons/ai';
import { FiClock, FiUser, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { useSteps } from '../context/StepsContext';
import { getModuleThemeColors } from './theme';
import { useLocation } from 'react-router-dom';
import Modal from './Modal';

// Dummy data for testing
const dummyDocumentVersionData = {
  version: 3,
  lastChangedTime: new Date('2024-01-15T14:30:00'),
  lastChangedBy: 'John Doe',
  status: 'draft' as 'draft' | 'approved',
  versions: [
    {
      id: 1,
      version: 1,
      createdAt: new Date('2024-01-10T09:00:00'),
      createdBy: 'Jane Smith',
      status: 'draft' as 'draft' | 'approved',
      changes: ['Initial document creation', 'Added basic structure'],
    },
    {
      id: 2,
      version: 2,
      createdAt: new Date('2024-01-12T11:15:00'),
      createdBy: 'Mike Johnson',
      status: 'approved' as 'draft' | 'approved',
      changes: ['Updated representative details', 'Added witness information'],
    },
    {
      id: 3,
      version: 3,
      createdAt: new Date('2024-01-15T14:30:00'),
      createdBy: 'John Doe',
      status: 'draft' as 'draft' | 'approved',
      changes: ['Modified conditions section', 'Updated scope details', 'Added new representative'],
    },
  ],
};

const VersionReviewOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({ isOpen, onClose, onApprove, onReject }) => {
  const [selectedVersion, setSelectedVersion] = useState<number>(dummyDocumentVersionData.versions.length - 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ top: '120px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Document Version Review</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Version List */}
        <div className="w-full sm:w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Version History</h3>
            <div className="space-y-2">
              {dummyDocumentVersionData.versions.map((version, index) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedVersion === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Version {version.version}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      version.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {version.status === 'approved' ? 'Approved' : 'Draft'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center mb-1">
                      <FiUser className="w-3 h-3 mr-1" />
                      {version.createdBy}
                    </div>
                    <div className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {version.createdAt.toLocaleDateString()} at {version.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version Details */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 sm:p-6">
            {selectedVersion !== undefined && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Version {dummyDocumentVersionData.versions[selectedVersion].version} Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created by:</span>
                      <span className="ml-2 font-medium">{dummyDocumentVersionData.versions[selectedVersion].createdBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created at:</span>
                      <span className="ml-2 font-medium">
                        {dummyDocumentVersionData.versions[selectedVersion].createdAt.toLocaleDateString()} at{' '}
                        {dummyDocumentVersionData.versions[selectedVersion].createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        dummyDocumentVersionData.versions[selectedVersion].status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dummyDocumentVersionData.versions[selectedVersion].status === 'approved' ? 'Approved' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Changes Made</h4>
                  <ul className="space-y-2">
                    {dummyDocumentVersionData.versions[selectedVersion].changes.map((change, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Document Preview Placeholder */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Document Preview</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>This would show the document content for this version...</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><strong>Principal:</strong> Jane Smith</p>
                      <p><strong>Representatives:</strong> 2 representatives assigned</p>
                      <p><strong>Conditions:</strong> 3 conditions defined</p>
                      <p><strong>Witnesses:</strong> 2 witnesses required</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {dummyDocumentVersionData.status === 'draft' && (
        <div className="flex items-center justify-between sm:justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="sm:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              <FiX className="w-4 h-4" />
              <span className="hidden sm:inline">Reject Latest Version</span>
              <span className="sm:hidden">Reject</span>
            </button>
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <FiCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Approve Latest Version</span>
              <span className="sm:hidden">Approve</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StepsBar: React.FC = () => {
  const { steps, activeStep, documentId, isInitialized, navigateToStepByIndex } = useSteps();
  const location = useLocation();
  const [isVersionReviewOpen, setIsVersionReviewOpen] = useState(false);
  
  // Get module slug from location
  const moduleSlug = location.pathname.split('/')[1];

  // Helper to get step URL using the context
  const getStepUrl = (stepIndex: number): string => {
    if (!documentId) return '/';
    // Use the context's navigation which handles module-specific URLs
    return '#'; // Will be handled by onClick
  };

  // Handle step click
  const handleStepClick = (stepIndex: number) => {
    navigateToStepByIndex(stepIndex);
  };

  const handleApprove = () => {
    console.log('Document approved');
    setIsVersionReviewOpen(false);
    // TODO: Implement actual approval logic
  };

  const handleReject = () => {
    console.log('Document rejected');
    setIsVersionReviewOpen(false);
    // TODO: Implement actual rejection logic
  };

  // Don't render anything if steps are not initialized yet
  if (!isInitialized || steps.length === 0) {
    return (
      <nav className="flex items-center justify-center px-4 py-4 bg-gray-100 border-b border-gray-200">
        <div className="text-sm text-gray-500">
          {!isInitialized ? 'Initializing...' : 'No steps available'}
        </div>
      </nav>
    );
  }

  // Get theme colors from the module
  const themeColors = getModuleThemeColors(moduleSlug);

  return (
    <div className="relative">
      <nav className="bg-gray-100 border-b border-gray-200 relative z-10">
        {/* Document Version Info */}
        {documentId && documentId !== 'new' && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-semibold text-gray-900">{dummyDocumentVersionData.version}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {dummyDocumentVersionData.lastChangedTime.toLocaleDateString()} at{' '}
                    {dummyDocumentVersionData.lastChangedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FiUser className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">by {dummyDocumentVersionData.lastChangedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    dummyDocumentVersionData.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {dummyDocumentVersionData.status === 'approved' ? 'Approved' : 'Draft Version'}
                  </span>
                </div>
              </div>
              {dummyDocumentVersionData.status === 'draft' && (
                <button
                  onClick={() => setIsVersionReviewOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <FiEye className="w-4 h-4" />
                  Review & Approve
                </button>
              )}
            </div>
          </div>
        )}

        {/* Steps Navigation - Only show when version review is closed */}
        {!isVersionReviewOpen && (
          <div className="flex items-center justify-center px-2 sm:px-6 py-4 overflow-x-auto">
            <div className="flex items-center min-w-max gap-1 sm:gap-2">
              {steps.map((step, index) => {
                return (
                  <React.Fragment key={step.title}>
                    {/* Step Node */}
                    <button
                      onClick={() => handleStepClick(index)}
                      className="flex flex-col items-center focus:outline-none flex-shrink-0 group"
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors text-base sm:text-lg
                          ${index === activeStep ? `${themeColors?.bg || 'bg-blue-600'} text-white` : 'bg-white border border-gray-300 text-gray-600'}`}
                      >
                        <AiOutlineRobot />
                      </div>
                      <span 
                        className="mt-1 text-[10px] sm:text-xs text-center text-gray-700 leading-tight max-w-[50px] sm:max-w-[80px] truncate px-1"
                        title={step.title}
                      >
                        {step.title}
                      </span>
                    </button>

                    {/* Connector Line - More visible on mobile */}
                    {index < steps.length - 1 && (
                      <div className="flex items-center">
                        <div className="w-3 sm:w-6 h-1 sm:h-0.5 bg-gray-400 rounded-full" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Version Review Overlay - Positioned to fill screen below the version bar */}
      <VersionReviewOverlay
        isOpen={isVersionReviewOpen}
        onClose={() => setIsVersionReviewOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default StepsBar; 