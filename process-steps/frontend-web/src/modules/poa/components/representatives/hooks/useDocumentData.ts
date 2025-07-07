import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSteps } from '../../../../../context/StepsContext';
import { DocumentService, Document, AuditResult } from '../../../services/DocumentService';
import AgentSDK from '@99xio/xians-sdk-typescript';
import { getAgentById } from '../../../utils/stepUtils';

type ConnectionStatus = 'initializing' | 'waiting_for_connection' | 'ready' | 'failed';

export const useDocumentData = () => {
  const { documentId, activeStep } = useSteps();
  const [document, setDocument] = useState<Document | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('initializing');

  const documentService = DocumentService.getInstance();
  const agentSDK = AgentSDK.getShared();

  // Check connection readiness for document data flow agent
  const checkConnectionReadiness = useCallback((): boolean => {
    const agent = getAgentById('document_data_flow');
    if (!agent || !agent.workflowType) {
      console.warn('[useDocumentData] Document data flow agent not found or missing workflowType');
      return false;
    }

    const connectionState = agentSDK.getAgentConnectionStateByWorkflowType(agent.workflowType);
    return connectionState?.status === 'connected';
  }, [agentSDK]);

  // Wait for connection to be ready
  const waitForConnection = useCallback((maxWaitTime: number = 15000): Promise<boolean> => {
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms

    return new Promise((resolve) => {
      const checkConnection = () => {
        if (checkConnectionReadiness()) {
          console.log('[useDocumentData] Connection ready for document fetch');
          resolve(true);
          return;
        }

        // Check if we've exceeded max wait time
        if (Date.now() - startTime >= maxWaitTime) {
          console.warn('[useDocumentData] Timeout waiting for connection');
          resolve(false);
          return;
        }

        // Continue waiting
        setTimeout(checkConnection, checkInterval);
      };

      checkConnection();
    });
  }, [checkConnectionReadiness]);

  const fetchDocument = useCallback(async (docId: string) => {
    if (!docId || docId === 'new') return;

    setLoading(true);
    setError(null);
    setConnectionStatus('initializing');

    try {
      console.log(`[useDocumentData] Fetching document: ${docId}`);

      // Wait for DocumentService initialization to complete
      await documentService.waitForInitialization();

      // First, try to find existing audit result in EntityStore
      let auditRes = documentService.findExistingAuditResult(docId);
      
      if (auditRes) {
        console.log(`[useDocumentData] Found existing audit result in EntityStore: ${docId}`);
        setAuditResult(auditRes);
        setDocument(auditRes.document);
        setLoading(false);
        setConnectionStatus('ready');
        return;
      }

      // Check if connection is already ready
      if (checkConnectionReadiness()) {
        console.log(`[useDocumentData] Connection already ready, fetching document: ${docId}`);
        setConnectionStatus('ready');
        
        try {
          auditRes = await documentService.fetchPOADocument(docId, activeStep);
          if (auditRes) {
            console.log(`[useDocumentData] Successfully fetched audit result: ${docId}`);
            setAuditResult(auditRes);
            setDocument(auditRes.document);
          } else {
            throw new Error('Failed to load document - document not found');
          }
        } catch (fetchError) {
          console.error('[useDocumentData] Document fetch failed:', fetchError);
          
          // Final attempt: check EntityStore again
          auditRes = documentService.findExistingAuditResult(docId);
          if (auditRes) {
            console.log(`[useDocumentData] Found audit result in EntityStore after failed fetch: ${docId}`);
            setAuditResult(auditRes);
            setDocument(auditRes.document);
          } else {
            throw fetchError;
          }
        }
      } else {
        // Wait for connection to be established
        console.log(`[useDocumentData] Waiting for connection to be established for document: ${docId}`);
        setConnectionStatus('waiting_for_connection');
        
        const connectionReady = await waitForConnection(15000);
        
        if (!connectionReady) {
          throw new Error('Connection timeout: Unable to establish connection to document service within 15 seconds. The service may be unavailable or experiencing issues.');
        }

        console.log(`[useDocumentData] Connection established, now fetching document: ${docId}`);
        setConnectionStatus('ready');
        
        try {
          auditRes = await documentService.fetchPOADocument(docId, activeStep);
          if (auditRes) {
            console.log(`[useDocumentData] Successfully fetched audit result via WebSocket: ${docId}`);
            setAuditResult(auditRes);
            setDocument(auditRes.document);
          } else {
            throw new Error('Failed to load document - document not found');
          }
        } catch (fetchError) {
          console.error('[useDocumentData] WebSocket fetch failed:', fetchError);
          
          // Final attempt: check EntityStore again
          auditRes = documentService.findExistingAuditResult(docId);
          if (auditRes) {
            console.log(`[useDocumentData] Found audit result in EntityStore after failed fetch: ${docId}`);
            setAuditResult(auditRes);
            setDocument(auditRes.document);
          } else {
            throw fetchError;
          }
        }
      }

    } catch (err) {
      console.error('[useDocumentData] Error fetching document:', err);
      let errorMessage = 'Failed to load document';
      
      if (err instanceof Error) {
        if (err.message.includes('Connection timeout') || err.message.includes('No connection available')) {
          errorMessage = 'Unable to connect to document service. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Document loading timed out. Please check your connection and try again.';
        } else if (err.message.includes('document not found')) {
          errorMessage = `Document with ID "${docId}" was not found. Please verify the document ID and try again.`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setConnectionStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [documentService, activeStep, checkConnectionReadiness, waitForConnection]);

  // Fetch document when documentId changes
  useEffect(() => {
    if (documentId && documentId !== 'new') {
      fetchDocument(documentId);
    } else {
      // Clear document for new/empty routes
      setDocument(null);
      setError(null);
      setConnectionStatus('initializing');
    }
  }, [documentId, fetchDocument]);

  // Subscribe to document updates
  useEffect(() => {
    if (!documentId || documentId === 'new') return;

    const unsubscribe = documentService.subscribeToAuditResultUpdates(
      documentId,
      (updatedAuditResult) => {
        console.log('[useDocumentData] Audit result updated:', updatedAuditResult);
        setAuditResult(updatedAuditResult);
        setDocument(updatedAuditResult.document);
      }
    );

    return unsubscribe;
  }, [documentId, documentService]);

  const refreshDocument = useCallback(async () => {
    if (!documentId || documentId === 'new') return;
    
    console.log(`[useDocumentData] Manual refresh for document: ${documentId}`);
    setLoading(true);
    setError(null);
    setConnectionStatus('initializing');
    
    try {
      // Wait for connection to be ready before retrying
      console.log('[useDocumentData] Waiting for connection before refresh...');
      setConnectionStatus('waiting_for_connection');
      
      const connectionReady = await waitForConnection(10000);
      
      if (!connectionReady) {
        throw new Error('Connection still not available after refresh. Please check your internet connection.');
      }

      setConnectionStatus('ready');
      
      // Try to refresh the document via WebSocket
      const refreshedAuditResult = await documentService.refreshDocument(documentId);
      if (refreshedAuditResult) {
        setAuditResult(refreshedAuditResult);
        setDocument(refreshedAuditResult.document);
        setLoading(false);
        return;
      }
      
      // If refresh fails, try comprehensive search again
      const existingAuditResult = documentService.findExistingAuditResult(documentId);
      if (existingAuditResult) {
        setAuditResult(existingAuditResult);
        setDocument(existingAuditResult.document);
        setLoading(false);
        return;
      }
      
      throw new Error('Document not found after refresh attempts');
    } catch (err) {
      console.error('[useDocumentData] Refresh failed:', err);
      setError(err instanceof Error ? err.message : 'Refresh failed');
      setConnectionStatus('failed');
      setLoading(false);
    }
  }, [documentId, documentService, waitForConnection]);

  // Memoize arrays to prevent infinite re-renders
  const representatives = useMemo(() => document?.representatives || [], [document?.representatives]);
  const conditions = useMemo(() => document?.conditions || [], [document?.conditions]);
  const witnesses = useMemo(() => document?.witnesses || [], [document?.witnesses]);
  const findings = useMemo(() => auditResult?.findings || [], [auditResult?.findings]);

  return {
    documentId,
    document,
    loading,
    error,
    connectionStatus,
    refreshDocument,
    representatives,
    principal: document?.principal,
    scope: document?.scope,
    conditions,
    witnesses,
    auditResult: auditResult,
    findings
  };
};