import { useContext } from 'react';
import { DataMessageContext } from '../context/dataMessageTypes';

// Global document context for non-React service access
export interface DocumentContextType {
  documentId: string | null;
}

export const useDocument = () => {
  const context = useContext(DataMessageContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};

/**
 * Extract document ID directly from the current URL
 * URL pattern: /:agentSlug/:botSlug/:documentId
 * @returns The document ID from the URL or null if not found
 */
export const getCurrentDocumentIdGlobal = (): string | null => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering or non-browser environment
  }
  
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean); // Remove empty segments
  
  // Expected URL pattern: /:agentSlug/:botSlug/:documentId
  // segments[0] = agentSlug, segments[1] = botSlug, segments[2] = documentId
  if (segments.length >= 3 && segments[2] !== 'new') {
    return segments[2];
  }
  
  return null;
};
