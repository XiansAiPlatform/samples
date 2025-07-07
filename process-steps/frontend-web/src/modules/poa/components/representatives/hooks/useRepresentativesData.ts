import { useState, useCallback, useEffect } from 'react';
import { useDocumentData } from './useDocumentData';
import { Representative } from '../types/representative.types';
import { 
  createEmptyRepresentative, 
  getValidRepresentatives 
} from '../utils/representative.utils';

export const useRepresentativesData = () => {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Get document data and listen to updates from EntityStore via DocumentService
  const { 
    document, 
    loading: documentLoading, 
    error: documentError,
    connectionStatus: documentConnectionStatus,
    representatives: documentRepresentatives 
  } = useDocumentData();

  // Initialize representatives from document data when available
  useEffect(() => {
    if (documentRepresentatives !== undefined) {
      if (documentRepresentatives.length > 0) {
        console.log('[useRepresentativesData] Initializing representatives from document:', documentRepresentatives);
        const formattedReps = documentRepresentatives.map((rep: any) => ({
          id: rep.id,
          fullName: rep.fullName || '',
          nationalId: rep.nationalId || '',
          relationship: rep.relationship || ''
        }));
        
        // Only update if the data is actually different
        setRepresentatives(prev => {
          // Simple comparison - if lengths differ or if we had empty array, update
          if (prev.length !== formattedReps.length || prev.length === 0) {
            return formattedReps;
          }
          // Keep existing if lengths match and we have data (avoid unnecessary re-renders)
          return prev;
        });
      } else {
        // Only clear if we actually have representatives to clear
        setRepresentatives(prev => prev.length > 0 ? [] : prev);
        console.log('[useRepresentativesData] Document has empty representatives, clearing local state');
      }
      // Exit edit mode when document data is loaded
      setEditingIndex(null);
    }
  }, [documentRepresentatives]);

  const addRepresentative = useCallback(() => {
    const newRep = createEmptyRepresentative();
    const newIndex = representatives.length;
    setRepresentatives(prev => [...prev, newRep]);
    setEditingIndex(newIndex); // Automatically enter edit mode for new representative
  }, [representatives.length]);

  const updateRepresentative = useCallback((index: number, field: keyof Representative, value: string) => {
    setRepresentatives(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const removeRepresentative = useCallback((index: number) => {
    setRepresentatives(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  }, [editingIndex]);

  const toggleEditMode = useCallback((index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null); // Exit edit mode
    } else {
      setEditingIndex(index); // Enter edit mode for this card
    }
  }, [editingIndex]);

  const clearAllRepresentatives = useCallback(() => {
    setRepresentatives([]);
    setEditingIndex(null);
  }, []);

  const saveRepresentatives = useCallback(() => {
    // Exit any editing mode
    setEditingIndex(null);
    
    // Here you would typically send the data to your backend/API
    console.log('Saving representatives:', representatives);
    
    // Get valid representatives for saving
    const validRepresentatives = getValidRepresentatives(representatives);
    console.log('Valid representatives to save:', validRepresentatives);
    
    // Show success feedback (you could add a toast notification here)
    // For now, we'll just log it
  }, [representatives]);

  return {
    representatives,
    editingIndex,
    setEditingIndex,
    addRepresentative,
    updateRepresentative,
    removeRepresentative,
    toggleEditMode,
    clearAllRepresentatives,
    saveRepresentatives,
    // Document-related data
    document,
    documentLoading,
    documentError,
    documentConnectionStatus
  };
}; 