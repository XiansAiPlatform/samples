import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { Description as ContractIcon } from '@mui/icons-material';
import EntityDetails from './EntityDetails';
import EntityOverview from './EntityOverview';
import AddPartyDialog from './AddPartyDialog';
import { useParams } from 'react-router-dom';
import { useDataMessage } from '../../../../hooks/useDataMessage';
import { useAuthActions } from '../../../../hooks/useAuth';
import { extractJwtIdToken } from '../../../../utils/authUtils';
import { legalDataService } from '../../services/legalDataService';
import type { EntityDetailsProps } from './EntityDetails';
import type { Bot, ContractValidation, Contract } from '../../../../types';
import type { DataMessagePayload } from '../../../../context/dataMessageTypes';

// Interface for DocumentUpdate message data structure (handles both casing variants)
interface DocumentUpdateData {
  contract?: Contract;
  Contract?: Contract;
  validations?: ContractValidation[];
  Validations?: ContractValidation[];
}

// Wrapper component for ContractEntityPanel with routing support
// Now renders EntityOverview (header + validation insights) and EntityDetails (document content) as separate components
interface ContractEntityPanelProps extends EntityDetailsProps {
  // Legacy props for backwards compatibility - no longer used since validation insights 
  // are shown automatically based on DocumentUpdate messages
  currentStep?: number;
  steps?: string[];
  
  // Optional agents prop for compatibility (no longer required)
  agents?: Bot[];
}

export const ContractEntityPanel: React.FC<ContractEntityPanelProps> = ({
  currentStep, // Deprecated - validation insights are now shown automatically
  steps,       // Deprecated - validation insights are now shown automatically
  ...entityPanelProps
}) => {
  const { mode, documentId } = useParams<{ mode?: string; documentId?: string }>();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editableContract, setEditableContract] = useState<Contract | null>(null);
  
  // Contract data state
  const [contractData, setContractData] = useState<Contract | null>(null);
  const [validations, setValidations] = useState<ContractValidation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Authentication state for JWT token
  const { isAuthenticated, user } = useAuthActions();
  
  // Data message context for subscribing to DocumentUpdate messages
  const dataMessageContext = useDataMessage();
  
  // Function to load contract document
  const loadDocument = useCallback(async (docId?: string) => {
    if (!docId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[ContractEntityPanel] Loading document:', docId);
      
      // Get JWT ID token from authenticated user
      const jwtToken = isAuthenticated ? extractJwtIdToken(user) : undefined;
      
      if (jwtToken) {
        console.log('[ContractEntityPanel] Making authenticated request with JWT token:', jwtToken.substring(0, 50) + '...');
      } else {
        console.log('[ContractEntityPanel] Making unauthenticated request');
      }
      
      const entityData = await legalDataService.getCurrentContract(jwtToken);
      
      if (entityData?.contract) {
        console.log('[ContractEntityPanel] Document loaded:', entityData.contract.title);
        setContractData(entityData.contract);
        setValidations(entityData.validations || []);
      } else {
        const errorMsg = 'No contract data received from service';
        console.error('[ContractEntityPanel] Document error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load document';
      console.error('[ContractEntityPanel] Error loading document:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Load document when documentId changes
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId, loadDocument]);
  
  // Refresh function
  const refreshDocument = useCallback(async () => {
    if (documentId) {
      await loadDocument(documentId);
    }
  }, [documentId, loadDocument]);
  
  // Edit mode handlers
  const handleEditToggle = useCallback(() => {
    if (!isEditing && contractData) {
      setEditableContract({ ...contractData });
    }
    setIsEditing(!isEditing);
  }, [isEditing, contractData]);

  const handleSave = useCallback((updatedContract: Contract) => {
    // For now, just update local state. In a real app, you'd save to backend
    // and the DocumentUpdate message would reflect the changes
    setIsEditing(false);
    setEditableContract(null);
    console.log('[ContractEntityPanel] Contract updated:', updatedContract.title);
    
    // TODO: Send update to backend via API call
    // The DocumentUpdate message will then update the state automatically
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditableContract(null);
  }, []);

  const handleContractChange = useCallback((updatedContract: Contract) => {
    setEditableContract(updatedContract);
  }, []);
  
  // Update browser title when contract data changes
  useEffect(() => {
    if (contractData?.title) {
      document.title = `Contract: ${contractData.title}`;
    } else {
      // Reset to default title when no contract is loaded
      document.title = 'Agentri';
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Agentri';
    };
  }, [contractData?.title]);

  // Subscribe to DocumentUpdate messages for real-time updates
  useEffect(() => {
    const handleDocumentUpdate = (payload: DataMessagePayload) => {
      console.log('[ContractEntityPanel] 🎯 DocumentUpdate handler called with payload:', payload);
      
      const data = payload.data as DocumentUpdateData;
      // Handle both possible casing variants
      const contract = data?.contract || data?.Contract;
      const validations = data?.validations || data?.Validations || [];
      
      if (data && contract) {
        console.log('[ContractEntityPanel] ✅ Valid contract data found, updating from message');
        setContractData(contract);
        setValidations(validations);
        setError(null);
      } else {
        console.warn('[ContractEntityPanel] ⚠️  DocumentUpdate payload missing contract data:', data);
        console.warn('[ContractEntityPanel] Available data keys:', data ? Object.keys(data) : 'no data');
      }
    };

    console.log('[ContractEntityPanel] 📝 Subscribing to DocumentUpdate messages');
    const unsubscribe = dataMessageContext.subscribe('DocumentUpdate', handleDocumentUpdate);
    return () => {
      console.log('[ContractEntityPanel] 🗑️ Unsubscribing from DocumentUpdate messages');
      unsubscribe();
    };
  }, [dataMessageContext]);

  // Determine entity based on route mode  
  const resolvedEntity = mode === 'new' ? null : entityPanelProps.entity;
  
  // Log deprecated usage for backwards compatibility tracking
  if (currentStep !== undefined || steps !== undefined) {
    console.warn('ContractEntityPanel: currentStep and steps props are deprecated. Validation insights are now shown automatically based on DocumentUpdate messages.');
  }
  
  console.log('ContractEntityPanel - mode:', mode, 'documentId:', documentId, 'hasContract:', !!contractData, 'isLoading:', isLoading, 'error:', error);
  
  // Show loading, error, or "No Contract Selected" message when there's no contract data
  if (!contractData && !resolvedEntity) {
    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
        p: 4
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <ContractIcon sx={{ fontSize: 80, mb: 3, opacity: 0.3 }} />
          {isLoading ? (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 400, mb: 2 }}>
                Loading Contract...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Fetching contract data from the service
              </Typography>
            </>
          ) : error ? (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 400, mb: 2, color: 'error.main' }}>
                Error Loading Contract
              </Typography>
              <Typography variant="body1" color="error" sx={{ mb: 1 }}>
                {error}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 400, mb: 2 }}>
                No Contract Selected
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Select a contract to view details or wait for contract data to load
              </Typography>
            </>
          )}
          {documentId && (
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7, fontFamily: 'monospace' }}>
              Document ID: {documentId}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Entity Overview - Header and Validation Summary */}
      <EntityOverview
        entity={resolvedEntity}
        contractData={isEditing ? editableContract : contractData}
        validations={validations}
        isEditing={isEditing}
        onRefreshDocument={refreshDocument}
        onEditToggle={handleEditToggle}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      
      {/* Entity Details - Document Content */}
      <EntityDetails 
        entity={resolvedEntity}
        contractData={contractData}
        validations={validations}
        isEditing={isEditing}
        onContractChange={handleContractChange}
      />
      
      {/* Add Party Dialog - Always mounted to listen for events */}
      <AddPartyDialog />
    </Box>
  );
};

export default ContractEntityPanel;