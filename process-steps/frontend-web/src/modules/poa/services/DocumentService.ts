import { EntityStore } from '../../../middleware/EntityStore';
import AgentSDK from '@99xio/xians-sdk-typescript';
import { BaseEntity } from '../../../types';
import { Agents } from '../steps';

// Helper function to get agent by ID
const getAgentById = (agentId: string) => {
  return Agents.find(agent => agent.id === agentId);
};

// Helper function to generate default metadata
const generateDefaultMetadata = () => {
  // Get current URL and extract relevant context
  const currentUrl = window.location.href;
  const urlParts = new URL(currentUrl);
  
  return {
    sourceUrl: currentUrl,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: `session_${Date.now()}`,
    contextPath: urlParts.pathname,
    // Add any other default metadata needed
  };
};

export interface Principal {
  userId: string;
  fullName: string;
  nationalId: string;
  address: string;
}

export interface Representative {
  id: string;
  fullName: string;
  nationalId: string;
  address: string;
  relationship: string;
}

export interface Condition {
  id: string;
  type: number;
  text: string;
  targetId?: string | null;
}

export interface Witness {
  id: string;
  fullName: string;
  nationalIdNumber: string;
}

export interface Finding {
  type: number;
  scope?: string;
  message: string;
  description: string;
  link?: string | null;
  actions?: Array<{
    title: string;
    prompt: string;
    scope?: string;
  }>;
}

export interface DocumentData {
  principal: Principal;
  scope: string;
  representatives: Representative[];
  conditions: Condition[];
  witnesses: Witness[];
}

// Backward compatibility type alias
export type Document = DocumentData;

export interface AuditResult extends BaseEntity {
  documentId: string;
  document: DocumentData;
  findings: Finding[];
  hasErrors: boolean;
  // Additional metadata for tracking
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class DocumentService {
  private static instance: DocumentService | null = null;
  private entityStore: EntityStore;
  private agentSDK: AgentSDK;
  private pendingRequests: Map<string, {
    resolve: (auditResult: AuditResult) => void;
    reject: (error: Error) => void;
    timeout: number;
  }> = new Map();
  private unsubscribeFromData?: () => void;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private activeFetches: Map<string, Promise<AuditResult>> = new Map();

  private constructor() {
    this.entityStore = EntityStore.getInstance();
    let sdkInstance: AgentSDK;
    try {
      sdkInstance = AgentSDK.getShared();
    } catch {
      sdkInstance = AgentSDK.initShared({
        ...(() => {
          const STORAGE_KEY = 'agent-settings';
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              // Migrate settings to new format
              return {
                agentWebsocketUrl: parsed.agentWebsocketUrl || '',
                Authorization: parsed.Authorization || parsed.agentApiKey || '',
                tenantId: parsed.tenantId || '',
                participantId: parsed.participantId || '',
                getDefaultData: () => {
                  return parsed.defaultMetadata || undefined;
                }
              };
            }
          } catch {
            /* ignore */
          }
          return {
            agentWebsocketUrl: '',
            Authorization: '',
            tenantId: '',
            participantId: '',
            getDefaultData: () => {
              // Return contextual data as needed
              // This can be dynamically computed based on current application state
              return undefined; // or return JSON.stringify(contextualData) when needed
            }
          };
        })()
      });
    }
    this.agentSDK = sdkInstance;

    // Ensure SDK is connected with all POA agents (fire-and-forget)
    const sdkAgents = Agents.map(a => ({
      id: a.id,
      workflowType: a.workflowType!, // workflowType is now required
      ...(a.workflowId ? { workflowId: a.workflowId } : {}),
      ...(a.agent ? { agent: a.agent } : {}),
      title: a.title,
      description: a.description
    }));
    void this.agentSDK.connect(sdkAgents);
    console.log('[DocumentService] Instance created');
    
    // Subscribe to document response metadata messages
    this.subscribeToDocumentResponses();
    
    // Automatically fetch document from URL (with connection readiness check)
    // Only initialize once to prevent multiple fetches
    if (!this.isInitialized) {
      this.initializationPromise = this.initializeFromURL();
    }
  }

  public static getInstance(): DocumentService {
    if (DocumentService.instance === null) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Initialize document from URL parameters
   */
  private async initializeFromURL(): Promise<void> {
    if (this.isInitialized) {
      console.log('[DocumentService] Already initialized, skipping URL initialization');
      return;
    }

    try {
      const documentId = this.extractDocumentIdFromURL();
      if (documentId) {
        console.log(`[DocumentService] Auto-fetching document from URL: ${documentId}`);
        
        // Check if audit result is already in cache
        const cachedAuditResult = this.findExistingAuditResult(documentId);
        if (cachedAuditResult) {
          console.log(`[DocumentService] Audit result already cached, skipping fetch: ${documentId}`);
          this.isInitialized = true;
          return;
        }
        
        // Wait for connection to be ready before fetching
        await this.fetchPOADocumentWithConnectionWait(documentId);
      } else {
        console.log('[DocumentService] No documentId found in URL');
      }
    } catch (error) {
      console.error('[DocumentService] Error initializing from URL:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  /**
   * Extract document ID from current URL
   */
  private extractDocumentIdFromURL(): string | null {
    if (typeof window === 'undefined') return null;
    
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    
    // Look for POA pattern: /poa/:documentId/:stepSlug
    if (pathParts.length >= 2 && pathParts[0] === 'poa') {
      const documentId = pathParts[1];
      // Make sure it's not 'new' which indicates a new document
      if (documentId && documentId !== 'new') {
        return documentId;
      }
    }
    
    // Legacy patterns for backward compatibility
    // e.g., /document/123, /poa/document/123, etc.
    const documentIndex = pathParts.findIndex(part => part === 'document');
    if (documentIndex !== -1 && pathParts[documentIndex + 1]) {
      return pathParts[documentIndex + 1];
    }
    
    // Also check query parameters
    return url.searchParams.get('documentId');
  }

  /**
   * Wait for agent connection to be ready
   */
  private async waitForAgentConnection(agentId: string, maxWaitTime: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms

    return new Promise((resolve) => {
      const checkConnection = () => {
        const agent = getAgentById(agentId);
        if (!agent) {
          console.warn(`[DocumentService] Agent not found: ${agentId}`);
          resolve(false);
          return;
        }

        const connectionState = agent.workflowType ? this.agentSDK.getAgentConnectionStateByWorkflowType(agent.workflowType) : undefined;
        
        if (connectionState?.status === 'connected') {
          console.log(`[DocumentService] Agent ${agentId} connection ready`);
          resolve(true);
          return;
        }

        // Check if we've exceeded max wait time
        if (Date.now() - startTime >= maxWaitTime) {
          console.warn(`[DocumentService] Timeout waiting for agent ${agentId} connection`);
          resolve(false);
          return;
        }

        // Continue waiting
        setTimeout(checkConnection, checkInterval);
      };

      checkConnection();
    });
  }



  /**
   * Fetch POA document with connection waiting and retry logic
   */
  private async fetchPOADocumentWithConnectionWait(documentId: string): Promise<AuditResult | null> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[DocumentService] Fetch attempt ${attempt}/${maxRetries} for document: ${documentId}`);
        
        // Wait for connection to be ready
        const connectionReady = await this.waitForAgentConnection('document_data_flow', 10000);
        
        if (!connectionReady) {
          throw new Error('Agent connection not ready within timeout');
        }

        // Attempt to fetch the document
        const auditResult = await this.fetchPOADocument(documentId);
        console.log(`[DocumentService] Successfully fetched audit result on attempt ${attempt}`);
        return auditResult;

      } catch (error) {
        console.warn(`[DocumentService] Attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, don't retry
        if (attempt === maxRetries) {
          console.error(`[DocumentService] All ${maxRetries} attempts failed for document: ${documentId}`);
          return null;
        }

        // Wait before retrying
        console.log(`[DocumentService] Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }

  /**
   * Fetch a POA document by ID via WebSocket
   */
  public async fetchPOADocument(documentId: string, stepIndex: number = 0): Promise<AuditResult> {
    // Check if audit result is already in cache
    const cachedAuditResult = this.entityStore.getEntityFromCategory<AuditResult>('audit_results', documentId);
    if (cachedAuditResult) {
      console.log(`[DocumentService] Found cached audit result: ${documentId}`);
      return cachedAuditResult;
    }

    // Check if there's already an active fetch for this document
    const activeFetch = this.activeFetches.get(documentId);
    if (activeFetch) {
      console.log(`[DocumentService] Reusing active fetch for document: ${documentId}`);
      return activeFetch;
    }

    const fetchPromise = new Promise<AuditResult>((resolve, reject) => {
      // Create unique request ID
      const requestId = `fetch_document_${documentId}_${Date.now()}`;

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        this.activeFetches.delete(documentId);
        reject(new Error(`Document fetch timeout for ID: ${documentId}`));
      }, 30000); // 30 second timeout

      // Store request
      this.pendingRequests.set(requestId, { 
        resolve: (auditResult: AuditResult) => {
          this.activeFetches.delete(documentId);
          resolve(auditResult);
        }, 
        reject: (error: Error) => {
          this.activeFetches.delete(documentId);
          reject(error);
        }, 
        timeout 
      });

      // Send message to fetch document
      const defaultMetadata = generateDefaultMetadata();
      const metadata = {
          messageType: 'FetchDocument',
          documentId: documentId,
          requestId: requestId,
          data: {
            ...defaultMetadata,
            documentId: documentId, // Ensure documentId is always in data
            requestId: requestId
          }
        };

      const wfId = getAgentById('document_data_flow')?.workflowType || 'document_data_flow';
      this.agentSDK.sendData(wfId, metadata)
        .then(() => {
          console.log(`[DocumentService] Document fetch request sent for ID: ${documentId}`);
        })
        .catch((error) => {
          this.pendingRequests.delete(requestId);
          this.activeFetches.delete(documentId);
          clearTimeout(timeout);
          reject(new Error(`Failed to send document fetch request: ${error.message}`));
        });
    });

    // Store the active fetch promise
    this.activeFetches.set(documentId, fetchPromise);
    
    return fetchPromise;
  }

  /**
   * Subscribe to document response data messages from WebSocket
   */
  private subscribeToDocumentResponses(): void {
    this.unsubscribeFromData = this.agentSDK.subscribeToData(
      'document_service',
      ['DocumentResponse', 'ActivityLog'], // Listen for these message types
      (message: any) => {
        console.log('[DocumentService] ✅ Received metadata message:', message);
        console.log('[DocumentService] 🔍 Message details:', {
          messageType: message.messageType,
          requestId: message.requestId,
          hasAuditResult: !!message.auditResult,
          allKeys: Object.keys(message)
        });
        
        if (message.messageType === 'ActivityLog') {
          console.log('[DocumentService] 📊 Processing ActivityLog message:', message);
          this.handleActivityLog(message);
        } else if (message.messageType === 'DocumentResponse') {
          console.log('[DocumentService] 📄 Processing DocumentResponse message:', message);
          this.handleDocumentResponse(message);
        } else {
          console.warn('[DocumentService] ⚠️ Unknown message type received:', message.messageType);
        }
      }
    );
    console.log('[DocumentService] 🎯 Subscribed to document response metadata messages for types: DocumentResponse, ActivityLog');
  }

  /**
   * Process and store audit result in EntityStore
   */
  private processAndStoreAuditResult(auditResult: any, documentId: string): AuditResult {
    try {
      // Ensure findings is always an array
      const findings = Array.isArray(auditResult.findings) ? auditResult.findings : [];
      
      // Create the complete audit result object
      const processedAuditResult: AuditResult = {
        id: `audit_result_${documentId}`,
        type: 'audit_result',
        documentId: documentId,
        document: {
          principal: auditResult.document?.principal || {
            userId: '',
            fullName: '',
            nationalId: '',
            address: ''
          },
          scope: auditResult.document?.scope || '',
          representatives: Array.isArray(auditResult.document?.representatives) ? auditResult.document.representatives : [],
          conditions: Array.isArray(auditResult.document?.conditions) ? auditResult.document.conditions : [],
          witnesses: Array.isArray(auditResult.document?.witnesses) ? auditResult.document.witnesses : []
        },
        findings: findings.map((finding: any) => ({
          type: finding.Type !== undefined ? finding.Type : (finding.type || 0),
          scope: finding.Scope || finding.scope,
          message: finding.Message || finding.message || '',
          description: finding.Description || finding.description || '',
          link: finding.Link || finding.link || null,
          actions: (finding.Actions || finding.actions || []).map((action: any) => ({
            title: action.Title || action.title || '',
            prompt: action.Prompt || action.prompt || '',
            scope: action.Scope || action.scope
          }))
        })),
        hasErrors: Boolean(auditResult.hasErrors || auditResult.HasErrors),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Store audit result in EntityStore under 'audit_results' category
      this.entityStore.addEntityToCategory('audit_results', documentId, processedAuditResult);

      console.log(`[DocumentService] Stored audit result for document: ${documentId}`, {
        hasErrors: processedAuditResult.hasErrors,
        findingsCount: processedAuditResult.findings.length,
        representativesCount: processedAuditResult.document.representatives.length,
        conditionsCount: processedAuditResult.document.conditions.length,
        witnessesCount: processedAuditResult.document.witnesses.length
      });

      // Log each finding for debugging
      processedAuditResult.findings.forEach((finding, index) => {
        const level = finding.type === 0 ? 'ERROR' : finding.type === 1 ? 'WARNING' : finding.type === 2 ? 'INFO' : 'SUGGESTION';
        console.log(`[DocumentService] Finding ${index + 1} (${level}): ${finding.message}`);
      });

      return processedAuditResult;
    } catch (error) {
      console.error('[DocumentService] Error processing audit result:', error);
      throw error;
    }
  }

  /**
   * Handle document response from WebSocket
   */
  private handleDocumentResponse(metadata: any): void {
    try {
      const { messageType, requestId, auditResult } = metadata;

      if (messageType !== 'DocumentResponse') {
        console.warn(`[DocumentService] Received unexpected message type: ${messageType}`);
        return;
      }
      if (!requestId || !this.pendingRequests.has(requestId)) {
        console.warn(`[DocumentService] Received response for unknown request: ${requestId}`);
        return;
      }

      const request = this.pendingRequests.get(requestId)!;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);

      // Get documentId from URL or from the document itself
      const urlDocumentId = this.extractDocumentIdFromURL();
      const serverDocumentId = auditResult?.document?.documentId || auditResult?.document?.id;
      const documentId = urlDocumentId || serverDocumentId;

      if (!documentId) {
        console.error('[DocumentService] No documentId found in URL or server response');
        request.reject(new Error('No documentId found'));
        return;
      }

      console.log('[DocumentService] Raw audit result from server:', auditResult);

      // Process and store the complete audit result
      const processedAuditResult = this.processAndStoreAuditResult(auditResult, documentId);

      console.log(`[DocumentService] Audit result received and stored: ${documentId}`);
      request.resolve(processedAuditResult);

    } catch (error) {
      console.error('[DocumentService] Error handling document response:', error);
      // Find and reject any pending request if we can't determine which one failed
      const firstPendingRequest = Array.from(this.pendingRequests.values())[0];
      if (firstPendingRequest) {
        clearTimeout(firstPendingRequest.timeout);
        firstPendingRequest.reject(new Error(`Document parsing error: ${error}`));
      }
    }
  }

  /**
   * Handle ActivityLog messages from WebSocket
   */
  private handleActivityLog(metadata: any): void {
    try {
      const { messageType, summary, details, auditResult, success, timestamp, requestId } = metadata;

      if (messageType !== 'ActivityLog') {
        console.warn(`[DocumentService] Received unexpected message type for ActivityLog: ${messageType}`);
        return;
      }

      console.log(`[DocumentService] ActivityLog received: ${summary}`, {
        details,
        success,
        timestamp,
        requestId
      });

      // If auditResult contains document updates, process them
      if (auditResult?.document) {
        console.log('[DocumentService] ActivityLog contains document update:', auditResult.document);

        // Get documentId from URL or from the document itself
        const urlDocumentId = this.extractDocumentIdFromURL();
        const serverDocumentId = auditResult?.document?.documentId || auditResult?.document?.id;
        const documentId = urlDocumentId || serverDocumentId;

        if (documentId) {
          // Check if we have an existing audit result to update
          let existingAuditResult = this.findExistingAuditResult(documentId);
          
          // Ensure findings is always an array
          const findings = Array.isArray(auditResult.findings) ? auditResult.findings : [];
          
          // Create or update the audit result with new data
          const updatedAuditResult: AuditResult = {
            id: existingAuditResult?.id || `audit_result_${documentId}`,
            type: 'audit_result',
            documentId: documentId,
            document: {
              principal: auditResult.document.principal || existingAuditResult?.document.principal || {
                userId: '',
                fullName: '',
                nationalId: '',
                address: ''
              },
              scope: auditResult.document.scope || existingAuditResult?.document.scope || '',
              representatives: Array.isArray(auditResult.document.representatives) ? auditResult.document.representatives : (existingAuditResult?.document.representatives || []),
              conditions: Array.isArray(auditResult.document.conditions) ? auditResult.document.conditions : (existingAuditResult?.document.conditions || []),
              witnesses: Array.isArray(auditResult.document.witnesses) ? auditResult.document.witnesses : (existingAuditResult?.document.witnesses || [])
            },
            findings: findings.map((finding: any) => ({
              type: finding.Type !== undefined ? finding.Type : (finding.type || 0),
              scope: finding.Scope || finding.scope,
              message: finding.Message || finding.message || '',
              description: finding.Description || finding.description || '',
              link: finding.Link || finding.link || null,
              actions: (finding.Actions || finding.actions || []).map((action: any) => ({
                title: action.Title || action.title || '',
                prompt: action.Prompt || action.prompt || '',
                scope: action.Scope || action.scope
              }))
            })),
            hasErrors: Boolean(auditResult.hasErrors || auditResult.HasErrors || existingAuditResult?.hasErrors),
            status: existingAuditResult?.status || 'draft',
            createdAt: existingAuditResult?.createdAt || new Date(),
            updatedAt: new Date(), // Always update the timestamp
            version: (existingAuditResult?.version || 0) + 1 // Increment version
          };

          // Store/update in EntityStore under 'audit_results' category
          this.entityStore.addEntityToCategory('audit_results', documentId, updatedAuditResult);

          console.log(`[DocumentService] Audit result updated from ActivityLog: ${documentId}`, {
            version: updatedAuditResult.version,
            representativesCount: updatedAuditResult.document.representatives.length,
            conditionsCount: updatedAuditResult.document.conditions.length,
            witnessesCount: updatedAuditResult.document.witnesses.length,
            findingsCount: updatedAuditResult.findings.length
          });

          // Legacy logging for backward compatibility
          if (updatedAuditResult.findings.length > 0) {
            console.log(`[DocumentService] Audit findings received:`, updatedAuditResult.findings);
            updatedAuditResult.findings.forEach((finding: any) => {
              const level = finding.type === 0 ? 'ERROR' : finding.type === 1 ? 'WARNING' : 'INFO';
              console.log(`[DocumentService] ${level}: ${finding.message}`);
            });
          }

          if (updatedAuditResult.hasErrors) {
            console.warn(`[DocumentService] Document has validation errors`);
          }
        } else {
          console.warn('[DocumentService] ActivityLog document update received but no documentId found');
        }
      } else {
        console.log(`[DocumentService] ActivityLog received without document update: ${summary}`);
      }

    } catch (error) {
      console.error('[DocumentService] Error handling ActivityLog:', error);
    }
  }

  /**
   * Wait for service initialization to complete
   */
  public async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Get cached audit result if available
   */
  public getCachedAuditResult(documentId: string): AuditResult | undefined {
    return this.findExistingAuditResult(documentId);
  }

  /**
   * Comprehensive audit result search that checks multiple sources in EntityStore
   */
  public findExistingAuditResult(documentId: string): AuditResult | undefined {
    console.log(`[DocumentService] Searching for existing audit result: ${documentId}`);
    
    // 1. First check the 'audit_results' category (primary location)
    let auditResult = this.entityStore.getEntityFromCategory<AuditResult>('audit_results', documentId);
    if (auditResult) {
      console.log(`[DocumentService] Found audit result in 'audit_results' category: ${documentId}`);
      return auditResult;
    }

    // 2. Check main entities store by ID
    auditResult = this.entityStore.getEntity<AuditResult>(`audit_result_${documentId}`);
    if (auditResult && auditResult.type === 'audit_result') {
      console.log(`[DocumentService] Found audit result in main entities store: ${documentId}`);
      return auditResult;
    }

    // 3. Search by type using getEntitiesByType
    const allAuditResults = this.entityStore.getEntitiesByType<AuditResult>('audit_result');
    const foundByType = allAuditResults.find(result => 
      result.documentId === documentId || result.id === `audit_result_${documentId}`
    );
    if (foundByType) {
      console.log(`[DocumentService] Found audit result using getEntitiesByType: ${documentId}`);
      return foundByType;
    }

    // 4. Search by documentId property in all entities of type 'audit_result' using getEntities
    const auditResults = this.entityStore.getEntities<AuditResult>({
      type: 'audit_result',
      filter: (entity) => (entity as AuditResult).documentId === documentId
    });
    
    if (auditResults.length > 0) {
      console.log(`[DocumentService] Found audit result by documentId property: ${documentId}`);
      return auditResults[0];
    }

    console.log(`[DocumentService] No existing audit result found for: ${documentId}`);
    return undefined;
  }

  /**
   * Backward compatibility method - Find existing document data from audit result
   * This method extracts document data from the audit result for legacy compatibility
   */
  public findExistingDocument(documentId: string): DocumentData | undefined {
    const auditResult = this.findExistingAuditResult(documentId);
    if (auditResult) {
      console.log(`[DocumentService] Found existing document via audit result: ${documentId}`);
      return auditResult.document;
    }
    console.log(`[DocumentService] No existing document found for: ${documentId}`);
    return undefined;
  }

  /**
   * Legacy method for backward compatibility - now returns document data from audit result
   */
  public getCachedDocument(documentId: string): DocumentData | undefined {
    const auditResult = this.getCachedAuditResult(documentId);
    return auditResult?.document;
  }

  /**
   * Legacy method for backward compatibility - now returns findings from audit result
   */
  public getCachedFindings(documentId: string): Finding[] {
    const auditResult = this.getCachedAuditResult(documentId);
    return auditResult?.findings || [];
  }

  /**
   * Subscribe to document data updates (from audit result)
   */
  public subscribeToDocumentUpdates(documentId: string, callback: (document: DocumentData) => void): () => void {
    return this.subscribeToAuditResultUpdates(documentId, (auditResult) => {
      callback(auditResult.document);
    });
  }

  /**
   * Subscribe to findings updates (from audit result)
   */
  public subscribeToFindingsUpdates(documentId: string, callback: (findings: Finding[]) => void): () => void {
    return this.subscribeToAuditResultUpdates(documentId, (auditResult) => {
      callback(auditResult.findings || []);
    });
  }

  /**
   * Subscribe to audit result updates
   */
  public subscribeToAuditResultUpdates(documentId: string, callback: (auditResult: AuditResult) => void): () => void {
    return this.entityStore.subscribeToEntities({
      id: `audit_result_${documentId}_${Date.now()}`,
      entityTypes: ['audit_result'],
      entityIds: [`audit_result_${documentId}`],
      callback: (entities, action) => {
        if (entities.length > 0) {
          const auditResult = entities[0] as AuditResult;
          if (auditResult.documentId === documentId) {
            // Ensure all arrays are properly initialized before calling callback
            const safeAuditResult: AuditResult = {
              ...auditResult,
              findings: auditResult.findings || [],
              document: {
                ...auditResult.document,
                representatives: auditResult.document?.representatives || [],
                conditions: auditResult.document?.conditions || [],
                witnesses: auditResult.document?.witnesses || []
              }
            };
            callback(safeAuditResult);
          }
        }
      }
    });
  }

  /**
   * Debug method to log EntityStore contents for troubleshooting
   */
  public debugEntityStore(documentId?: string): void {
    console.log('[DocumentService] === EntityStore Debug Info ===');
    
    // Log main entities
    const allEntities = this.entityStore.getEntities();
    console.log(`[DocumentService] Total entities in store: ${allEntities.length}`);
    
    // Log audit results specifically
    const auditResults = this.entityStore.getEntities<AuditResult>({ type: 'audit_result' });
    console.log(`[DocumentService] Audit results: ${auditResults.length}`);
    auditResults.forEach(result => {
      console.log(`[DocumentService] - Audit Result: id=${result.id}, documentId=${result.documentId}, hasErrors=${result.hasErrors}`);
    });
    
    // Log all categories
    const categories = this.entityStore.getAllCategories();
    console.log(`[DocumentService] Categories: ${categories.size}`);
    categories.forEach((entityMap, categoryName) => {
      console.log(`[DocumentService] - Category '${categoryName}': ${entityMap.size} entities`);
      entityMap.forEach((entity, key) => {
        const entityInfo = entity as any;
        console.log(`[DocumentService]   - Key '${key}': id=${entityInfo.id}, type=${entityInfo.type}, documentId=${entityInfo.documentId || 'N/A'}`);
      });
    });
    
    // Log document categories
    const docCategories = this.entityStore.getAllDocumentCategories();
    console.log(`[DocumentService] Document categories: ${docCategories.length}`);
    docCategories.forEach(({ category, documents }) => {
      console.log(`[DocumentService] - Doc Category '${category}': ${documents.length} documents`);
    });
    
    // If specific documentId provided, show detailed search
    if (documentId) {
      console.log(`[DocumentService] === Searching for audit result: ${documentId} ===`);
      const found = this.findExistingAuditResult(documentId);
      console.log(`[DocumentService] Search result:`, found ? 'FOUND' : 'NOT FOUND');
      if (found) {
        console.log(`[DocumentService] Found audit result:`, found);
      }
    }
    
    console.log('[DocumentService] === End EntityStore Debug Info ===');
  }

  /**
   * Clear document cache
   */
  public clearCache(): void {
    this.entityStore.clearCategory('audit_results');
    this.entityStore.clearCategory('poa'); // Keep for backward compatibility
    this.entityStore.clearCategory('findings'); // Keep for backward compatibility
    
    // Clear any pending requests
    this.pendingRequests.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error('Service cache cleared'));
    });
    this.pendingRequests.clear();
    
    // Clear active fetches
    this.activeFetches.clear();
    
    // Reset initialization state
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Cleanup method to unsubscribe from data messages
   */
  public cleanup(): void {
    if (this.unsubscribeFromData) {
      this.unsubscribeFromData();
      this.unsubscribeFromData = undefined;
      console.log('[DocumentService] Unsubscribed from data messages');
    }
    this.clearCache();
  }

  /**
   * Attempt to refresh/restore an audit result by forcing a fetch
   * This method is useful when the audit result should exist but is not found in EntityStore
   */
  public async refreshDocument(documentId: string): Promise<AuditResult | null> {
    console.log(`[DocumentService] Attempting to refresh audit result: ${documentId}`);
    
    try {
      // Wait for connection to be ready before attempting refresh
      const connectionReady = await this.waitForAgentConnection('document_data_flow', 10000);
      
      if (!connectionReady) {
        console.warn(`[DocumentService] Cannot refresh audit result ${documentId}: agent connection not ready`);
        return null;
      }
      
      // Fetch the audit result
      const auditResult = await this.fetchPOADocument(documentId);
      console.log(`[DocumentService] Successfully refreshed audit result: ${documentId}`);
      return auditResult;
      
    } catch (error) {
      console.error(`[DocumentService] Failed to refresh audit result ${documentId}:`, error);
      return null;
    }
  }
} 