import { useState, useEffect, useCallback } from 'react';
import { useEntitiesByType } from '../../../context/EntityContext';
import { AuditResultEntity } from '../../../types/entities';
import { Finding, FindingType } from '../components/FindingsPane';

interface UseFindingsDataReturn {
  findings: Finding[];
  loading: boolean;
  error: string | null;
  auditResult: AuditResultEntity | null;
}

// Map finding type strings/numbers to FindingType
const mapFindingType = (typeString: string | number): FindingType => {
  // Handle legacy numeric types for backward compatibility
  if (typeof typeString === 'number') {
    switch (typeString) {
      case 0:
        return 'error';
      case 1:
        return 'warning';
      case 2:
      case 3:
      default:
        return 'suggestion';
    }
  }
  
  // Handle new string types
  if (typeof typeString === 'string') {
    switch (typeString.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'information':
      case 'suggestion':
      default:
        return 'suggestion';
    }
  }
  
  return 'suggestion'; // default fallback
};

/**
 * Hook for subscribing to findings data from audit result entities
 * This replaces the dependency on representatives' useDocumentData
 */
export const useFindingsData = (documentId?: string): UseFindingsDataReturn => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResultEntity | null>(null);

  // Subscribe to all audit result entities
  const auditResults = useEntitiesByType<AuditResultEntity>('audit_result');

  // Transform findings from audit result to component format
  const transformFindings = useCallback((findingsArray: any[]): Finding[] => {
    return (findingsArray || []).map((finding, index) => ({
      id: index + 1,
      type: mapFindingType(finding.type || finding.Type || 0),
      title: finding.message || finding.Message || '',
      description: finding.description || finding.Description || '',
      link: finding.link || finding.Link || undefined,
      actions: finding.actions || finding.Actions || []
    }));
  }, []);

  // Process audit results and extract findings
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Find the relevant audit result
      let relevantAuditResult: AuditResultEntity | null = null;

      if (documentId) {
        // Filter by specific document ID if provided
        relevantAuditResult = auditResults.find(result => 
          result.documentId === documentId || 
          result.id === `audit_result_${documentId}`
        ) || null;
      } else {
        // Use the most recent audit result if no specific document ID
        relevantAuditResult = auditResults.length > 0 
          ? auditResults.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0]
          : null;
      }

      setAuditResult(relevantAuditResult);

      if (relevantAuditResult) {
        console.log('[useFindingsData] Processing audit result:', relevantAuditResult.id);
        
        // Extract findings from the audit result
        const auditFindings = relevantAuditResult.findings || [];
        const transformedFindings = transformFindings(auditFindings);
        
        console.log('[useFindingsData] Transformed findings:', transformedFindings.length);
        setFindings(transformedFindings);
      } else {
        console.log('[useFindingsData] No relevant audit result found');
        setFindings([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('[useFindingsData] Error processing audit results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load findings');
      setFindings([]);
      setLoading(false);
    }
  }, [auditResults, documentId, transformFindings]);

  // Initial loading state management
  useEffect(() => {
    // Set loading to false after a short delay if no audit results are found
    // This prevents indefinite loading when no document is selected
    const timeout = setTimeout(() => {
      if (auditResults.length === 0) {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [auditResults.length]);

  return {
    findings,
    loading,
    error,
    auditResult
  };
}; 