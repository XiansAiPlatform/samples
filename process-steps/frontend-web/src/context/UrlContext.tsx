import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export interface UrlContextData {
  documentId: string | null;
  moduleSlug: string | null;
  stepSlug: string | null;
  pathname: string;
  searchParams: URLSearchParams;
  fullUrl: string;
  isWorkflowRoute: boolean;
  isDashboardRoute: boolean;
}

interface UrlContextValue {
  urlData: UrlContextData;
  /**
   * Extract document ID from URL using multiple patterns
   * - /moduleSlug/documentId/stepSlug (primary pattern)
   * - Query parameter ?documentId=...
   * - Legacy patterns with 'document' keyword
   */
  getDocumentId: () => string | null;
  /**
   * Get module slug from URL path
   */
  getModuleSlug: () => string | null;
  /**
   * Get step slug from URL path
   */
  getStepSlug: () => string | null;
  /**
   * Check if current route is a workflow route (has document ID)
   */
  isWorkflow: () => boolean;
  /**
   * Check if current route is a module dashboard route
   */
  isDashboard: () => boolean;
}

const UrlContext = createContext<UrlContextValue | undefined>(undefined);

export const UrlProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const params = useParams<{ documentId?: string; stepSlug?: string }>();
  
  const urlData = useMemo(() => {
    const url = new URL(window.location.href);
    const pathParts = location.pathname.split('/').filter(part => part.length > 0);
    
    // Extract module slug (first path segment)
    const moduleSlug = pathParts.length > 0 ? pathParts[0] : null;
    
    // Extract document ID from URL params or path analysis
    let documentId: string | null = null;
    
    // Try to get from React Router params first
    if (params.documentId && params.documentId !== 'new') {
      documentId = params.documentId;
    } else {
      // Look for patterns like /moduleSlug/documentId/stepSlug
      if (pathParts.length >= 2 && pathParts[1] !== 'new') {
        documentId = pathParts[1];
      } else {
        // Legacy patterns - look for 'document' keyword
        const documentIndex = pathParts.findIndex(part => part === 'document');
        if (documentIndex !== -1 && pathParts[documentIndex + 1]) {
          documentId = pathParts[documentIndex + 1];
        } else {
          // Check query parameters
          documentId = url.searchParams.get('documentId');
        }
      }
    }
    
    // Extract step slug
    const stepSlug = params.stepSlug || (pathParts.length >= 3 ? pathParts[2] : null);
    
    // Determine route type
    const isWorkflowRoute = Boolean(documentId && stepSlug);
    const isDashboardRoute = Boolean(moduleSlug && !documentId);
    
    return {
      documentId,
      moduleSlug,
      stepSlug,
      pathname: location.pathname,
      searchParams: url.searchParams,
      fullUrl: url.href,
      isWorkflowRoute,
      isDashboardRoute,
    };
  }, [location.pathname, location.search, params.documentId, params.stepSlug]);

  const getDocumentId = () => urlData.documentId;
  const getModuleSlug = () => urlData.moduleSlug;
  const getStepSlug = () => urlData.stepSlug;
  const isWorkflow = () => urlData.isWorkflowRoute;
  const isDashboard = () => urlData.isDashboardRoute;

  const value: UrlContextValue = {
    urlData,
    getDocumentId,
    getModuleSlug,
    getStepSlug,
    isWorkflow,
    isDashboard,
  };

  return <UrlContext.Provider value={value}>{children}</UrlContext.Provider>;
};

export const useUrl = () => {
  const ctx = useContext(UrlContext);
  if (!ctx) {
    throw new Error('useUrl must be used within a UrlProvider');
  }
  return ctx;
};

/**
 * Hook to get document ID from URL - convenience hook
 */
export const useDocumentId = () => {
  const { getDocumentId } = useUrl();
  return getDocumentId();
};

/**
 * Hook to get module slug from URL - convenience hook
 */
export const useModuleSlug = () => {
  const { getModuleSlug } = useUrl();
  return getModuleSlug();
};

/**
 * Utility function to extract document ID from URL without React context
 * Useful for services and non-React code
 */
export const extractDocumentIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  
  // Look for pattern: /moduleSlug/documentId/stepSlug
  if (pathParts.length >= 2 && pathParts[1] !== 'new') {
    return pathParts[1];
  }
  
  // Legacy patterns for backward compatibility
  const documentIndex = pathParts.findIndex(part => part === 'document');
  if (documentIndex !== -1 && pathParts[documentIndex + 1]) {
    return pathParts[documentIndex + 1];
  }
  
  // Check query parameters
  return url.searchParams.get('documentId');
};

/**
 * Utility function to extract module slug from URL without React context
 */
export const extractModuleSlugFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const pathParts = window.location.pathname.split('/').filter(part => part.length > 0);
  return pathParts.length > 0 ? pathParts[0] : null;
}; 