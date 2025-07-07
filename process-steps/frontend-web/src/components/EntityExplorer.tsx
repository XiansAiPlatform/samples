import React, { useState, useEffect, useRef } from 'react';
import { useEntities } from '../context/EntityContext';
import { EntityStore } from '../middleware/EntityStore';
import { DocumentService } from '../modules/poa/services/DocumentService';
import { BaseEntity } from '../types';

interface DocumentCategory {
  category: string;
  documents: BaseEntity[];
}

const EntityExplorer: React.FC = () => {
  const { loading, error, getStats } = useEntities();
  const entityStore = useRef(EntityStore.getInstance());
  const documentService = useRef(DocumentService.getInstance());
  
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<BaseEntity | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [updates, setUpdates] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to entity updates
  useEffect(() => {
    const unsubscribe = entityStore.current.subscribe(() => {
      updateDocumentCategories();
    });

    // Initial load
    updateDocumentCategories();

    return unsubscribe;
  }, []);

  // Subscribe to document updates for logging
  useEffect(() => {
    const unsubscribe = entityStore.current.subscribeToEntities({
      id: 'document_subscription',
      callback: (entities, action) => {
        const timestamp = new Date().toLocaleTimeString();
        if (entities.length > 0) {
          const message = `[${timestamp}] ${action.type}: ${entities.length} entities`;
          setUpdates(prev => [message, ...prev.slice(0, 4)]);
        }
      }
    });

    return unsubscribe;
  }, []);

  const updateDocumentCategories = () => {
    const categories = entityStore.current.getAllDocumentCategories();
    setDocumentCategories(categories);
    
    // Auto-select first category if none selected
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].category);
    }
  };

  const handleDocumentClick = (document: BaseEntity) => {
    setSelectedDocument(document);
    setCopyStatus('idle');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedDocument(null);
    setSearchTerm('');
  };

  const getTotalDocuments = () => {
    return documentCategories.reduce((total, cat) => total + cat.documents.length, 0);
  };

  // Helper function to get display title for any entity
  const getDisplayTitle = (entity: BaseEntity): string => {
    const anyEntity = entity as any;
    return anyEntity.title || 
           anyEntity.documentId || 
           anyEntity.name || 
           `${entity.type} - ${entity.id.substring(0, 8)}`;
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    if (!selectedDocument) return;

    try {
      const jsonString = JSON.stringify(selectedDocument, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const refreshDocuments = () => {
    updateDocumentCategories();
  };

  const stats = getStats();

  // Filter documents based on search term
  const getFilteredDocuments = (documents: BaseEntity[]) => {
    if (!searchTerm) return documents;
    return documents.filter(doc => 
      getDisplayTitle(doc).toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const selectedCategoryData = documentCategories.find(cat => cat.category === selectedCategory);
  const filteredDocuments = selectedCategoryData ? getFilteredDocuments(selectedCategoryData.documents) : [];

  return (
    <div className="h-full bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Entity Explorer</h1>
          <p className="text-sm text-gray-600 mb-4">Browse and inspect entities by category</p>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={refreshDocuments}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => documentService.current.clearCache()}
              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium"
            >
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalDocuments()}</div>
              <div className="text-xs text-gray-600">Total Entities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{documentCategories.length}</div>
              <div className="text-xs text-gray-600">Categories</div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Categories</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {documentCategories.map(({ category, documents }) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                  selectedCategory === category
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-transparent text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{category}</div>
                    <div className="text-xs text-gray-500">{documents.length} entities</div>
                  </div>
                  {selectedCategory === category && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        {updates.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recent Updates</h3>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {updates.map((update, index) => (
                <div key={index} className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">
                  {update}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-800 text-sm">Loading entities...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">Error: {error}</span>
            </div>
          </div>
        )}

        {selectedDocument ? (
          /* Entity Detail View */
          <div className="flex-1 flex flex-col">
            {/* Detail Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{getDisplayTitle(selectedDocument)}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedDocument.type} • Created {selectedDocument.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyJson}
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    copyStatus === 'success' 
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : copyStatus === 'error'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                  disabled={copyStatus !== 'idle'}
                >
                  {copyStatus === 'success' ? (
                    <>
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : copyStatus === 'error' ? (
                    <>
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Failed
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* JSON Content */}
            <div className="flex-1 bg-gray-900 p-6 overflow-auto">
              <pre className="text-sm text-green-400 font-mono leading-relaxed">
                {JSON.stringify(selectedDocument, null, 2)}
              </pre>
            </div>
          </div>
        ) : selectedCategory ? (
          /* Entity List View */
          <div className="flex-1 flex flex-col">
            {/* List Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedCategory}</h2>
                  <p className="text-sm text-gray-500">{filteredDocuments.length} entities</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search entities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Entity List */}
            <div className="flex-1 overflow-auto p-6">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">
                    {searchTerm ? 'No entities match your search' : 'No entities in this category'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDocuments.map(entity => (
                    <div
                      key={entity.id}
                      onClick={() => handleDocumentClick(entity)}
                      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer p-6 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {getDisplayTitle(entity)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{entity.type}</p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          ID: {entity.id.substring(0, 12)}...
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {entity.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Welcome State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Entity Explorer</h3>
              <p className="text-gray-500 max-w-sm">
                {documentCategories.length === 0 
                  ? 'No entities found. Load some data to get started.'
                  : 'Select a category from the sidebar to browse entities.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityExplorer; 