import React, { useState, useCallback } from 'react';
import { DocumentService, Condition } from '../../../services/DocumentService';
import { useSteps } from '../../../../../context/StepsContext';
import ConditionsHeader from './ConditionsHeader';
import ConditionCard from './ConditionCard';
import AddConditionCard from './AddConditionCard';
import { getThemeColors } from '../../../../../components/theme';

// Map numeric condition types to display labels
const getConditionTypeLabel = (type: number): string => {
  switch (type) {
    case 0: return 'Restriction';
    case 1: return 'Permission';
    case 2: return 'General';
    case 3: return 'Special';
    default: return 'Unknown';
  }
};

// Map numeric condition types to colors
const getConditionTypeColor = (type: number): string => {
  switch (type) {
    case 0: return 'bg-red-100 text-red-800'; // Restriction - red
    case 1: return 'bg-green-100 text-green-800'; // Permission - green
    case 2: return 'bg-blue-100 text-blue-800'; // General - blue
    case 3: return 'bg-purple-100 text-purple-800'; // Special - purple
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Custom hook for conditions data (similar to useRepresentativesData)
const useConditionsData = () => {
  const { documentId } = useSteps();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const documentService = DocumentService.getInstance();

  // Initialize and subscribe to document updates
  React.useEffect(() => {
    if (!documentId || documentId === 'new') {
      setConditions([]);
      setLoading(false);
      return;
    }

    const initializeConditions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait for DocumentService initialization
        await documentService.waitForInitialization();

        // Try to get cached audit result first
        const cachedAuditResult = documentService.getCachedAuditResult(documentId);
        if (cachedAuditResult) {
          console.log('[useConditionsData] Using cached audit result:', cachedAuditResult);
          setConditions(cachedAuditResult.document.conditions || []);
        } else {
          console.log('[useConditionsData] No cached result, attempting to fetch...');
          try {
            const fetchedResult = await documentService.fetchPOADocument(documentId);
            setConditions(fetchedResult.document.conditions || []);
          } catch (fetchError) {
            console.warn('[useConditionsData] Could not fetch document, will wait for updates:', fetchError);
            // Don't set error here, just wait for potential updates
          }
        }
      } catch (err) {
        console.error('[useConditionsData] Error initializing:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeConditions();
  }, [documentId, documentService]);

  // Subscribe to audit result updates (this is the key fix)
  React.useEffect(() => {
    if (!documentId || documentId === 'new') return;

    console.log(`[useConditionsData] Subscribing to audit result updates for document: ${documentId}`);
    
    const unsubscribe = documentService.subscribeToAuditResultUpdates(
      documentId,
      (updatedAuditResult) => {
        console.log('[useConditionsData] Received audit result update:', updatedAuditResult);
        setConditions(updatedAuditResult.document.conditions || []);
        setError(null); // Clear any previous errors
      }
    );

    return () => {
      console.log(`[useConditionsData] Unsubscribing from updates for document: ${documentId}`);
      unsubscribe();
    };
  }, [documentId, documentService]);

  const addCondition = useCallback((newCondition: Omit<Condition, 'id'>) => {
    const condition: Condition = {
      id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newCondition
    };

    setConditions(prev => [condition, ...prev]);
    // Start editing the new condition (now at index 0)
    setEditingIndex(0);

    // TODO: Send update to DocumentService/WebSocket
    console.log('[useConditionsData] Added condition (local only):', condition);
    
    return condition;
  }, []);

  const updateCondition = useCallback((index: number, updatedCondition: Omit<Condition, 'id'>) => {
    setConditions(prev => prev.map((c, i) => 
      i === index ? { ...updatedCondition, id: c.id } : c
    ));
    
    // TODO: Send update to DocumentService/WebSocket
    console.log('[useConditionsData] Updated condition (local only):', index, updatedCondition);
  }, []);

  const removeCondition = useCallback((index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    
    // TODO: Send update to DocumentService/WebSocket
    console.log('[useConditionsData] Removed condition (local only):', index);
  }, [editingIndex]);

  const toggleEditMode = useCallback((index: number) => {
    setEditingIndex(editingIndex === index ? null : index);
  }, [editingIndex]);

  const handleExitEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const saveConditions = useCallback(() => {
    // TODO: Implement save functionality
    console.log('Saving conditions:', conditions);
    // You can add API call here to save conditions
  }, [conditions]);

  return {
    conditions,
    loading,
    error,
    documentId,
    editingIndex,
    addCondition,
    updateCondition,
    removeCondition,
    toggleEditMode,
    handleExitEdit,
    saveConditions
  };
};

const Conditions: React.FC = () => {
  const { 
    conditions, 
    loading, 
    error, 
    documentId, 
    editingIndex,
    addCondition, 
    updateCondition,
    removeCondition,
    toggleEditMode,
    handleExitEdit,
    saveConditions
  } = useConditionsData();

  // Get theme colors using the custom color palette
  const theme = getThemeColors('purple');  // Primary purple theme
  const errorTheme = getThemeColors('error');  // Semantic error theme
  const warningTheme = getThemeColors('warning');  // Semantic warning theme

  // Filter conditions to show only those with data or currently being edited
  const shouldDisplayCondition = (condition: Condition, index: number): boolean => {
    // Always show if editing
    if (editingIndex === index) return true;
    // Show if has text (main required field)
    return condition.text.trim().length > 0;
  };

  const displayedConditions = conditions.filter((condition, index) => 
    shouldDisplayCondition(condition, index)
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <ConditionsHeader
          conditions={[]}
          onSave={saveConditions}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`animate-spin w-12 h-12 border-4 ${theme.bg} border-t-transparent rounded-full mx-auto mb-4`}></div>
            <h3 className={`text-lg font-medium ${theme.text} mb-2`}>Loading conditions...</h3>
            <p className="text-gray-600 text-sm">Fetching document data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white">
        <ConditionsHeader
          conditions={conditions}
          onSave={saveConditions}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className={`w-16 h-16 ${errorTheme.bgLight} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className={`w-8 h-8 ${errorTheme.bg.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>Error Loading Conditions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className={`px-4 py-2 ${errorTheme.buttonPrimary} text-white rounded-md ${errorTheme.buttonPrimaryHover} transition-colors`}
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <ConditionsHeader
        conditions={conditions}
        onSave={saveConditions}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 mx-4 sm:mx-6 lg:mx-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Add Condition Button */}
            <AddConditionCard onAdd={addCondition} />
            
            {/* Conditions List */}
            <div className="space-y-0">
              {displayedConditions.map((condition, displayIndex) => {
                // Find the original index in the full conditions array
                const originalIndex = conditions.findIndex(c => c === condition);
                const isEditing = editingIndex === originalIndex;
                const canRemove = true;
                
                return (
                  <ConditionCard
                    key={originalIndex}
                    condition={condition}
                    index={originalIndex}
                    isEditing={isEditing}
                    canRemove={canRemove}
                    onToggleEdit={toggleEditMode}
                    onUpdate={updateCondition}
                    onRemove={removeCondition}
                    onExitEdit={handleExitEdit}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {displayedConditions.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No conditions defined yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add New Condition" above to get started</p>
              </div>
            )}

            {/* Add bottom padding to ensure content is not hidden by footer */}
            <div className="pb-16 sm:pb-20"></div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conditions; 