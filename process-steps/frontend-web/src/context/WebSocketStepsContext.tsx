import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatMessage, ConnectionState, ActivityData } from '../types';
import AgentSDK from '@99xio/xians-sdk-typescript';
import { useSteps } from './StepsContext';
import { useSettings } from './SettingsContext';
import { getModuleBySlug } from '../modules/modules';
import { useLocation } from 'react-router-dom';

interface WebSocketStepsContextType {
  // Connection states
  connectionStates: Map<number, ConnectionState>;
  isConnected: boolean;
  
  // Messages - now keyed by workflowType for shared chat histories
  chatMessages: Map<string, ChatMessage[]>;
  
  // Helper to get chat messages for a specific step (accessing shared history)
  getChatMessagesForStep: (stepIndex: number) => ChatMessage[];
  
  // Typing state for handoff scenarios
  handoffTypingStates: Map<number, boolean>;
  
  // Pending ActivityLog data (for backward compatibility with TypingIndicator)
  activityLogStates: Map<number, ActivityData[]>;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (text: string, data?: any, targetStepIndex?: number) => Promise<void>;
  
  // Typing control for external components (like FindingsPane)
  setHandoffTyping: (stepIndex: number, isTyping: boolean) => void;
  
  // ActivityLog management (for backward compatibility)
  addActivityLog: (stepIndex: number, activityData: ActivityData) => void;
  clearActivityLogs: (stepIndex: number) => void;
  
  // Data subscription
  subscribeToData: (subscriberId: string, messageTypes: string[], callback: (message: any) => void, stepIndex?: number) => () => void;
  unsubscribeFromData: (subscriberId: string) => void;
  
  // Chat message subscription
  subscribeToChatMessages: (callback: (chat: any) => void) => () => void;
  
  // Handoff subscription
  subscribeToHandoffs: (callback: (handoff: any) => void) => () => void;
  
  // Statistics
  getStats: () => any;
}

const WebSocketStepsContext = createContext<WebSocketStepsContextType | null>(null);

export const useWebSocketSteps = () => {
  const context = useContext(WebSocketStepsContext);
  if (!context) {
    throw new Error('useWebSocketSteps must be used within WebSocketStepsProvider');
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

export const WebSocketStepsProvider: React.FC<Props> = ({ children }) => {
  // Use location to get current module
  const location = useLocation();
  const moduleSlug = location.pathname.split('/')[1];
  
  // Use steps context only if available (optional for dashboard routes)
  let steps: any[] = [];
  let activeStep: number | null = null;
  let isInitialized = false;
  let setActiveStep: any = () => {};
  
  try {
    const stepsContext = useSteps();
    steps = stepsContext.steps;
    activeStep = stepsContext.activeStep;
    isInitialized = stepsContext.isInitialized;
    setActiveStep = stepsContext.setActiveStep;

  } catch (error) {
    // StepsContext not available - use defaults for dashboard routes
    console.log('[WebSocketStepsContext] StepsContext not available, using defaults');
  }
  
  const { settings } = useSettings();
  
  // Determine if we're on a workflow route vs dashboard route from URL pattern
  // Parse pathname directly since useParams doesn't work above Routes level
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isWorkflowRoute = pathSegments.length >= 3; // e.g., ['poa', 'documentId', 'stepSlug']
  const documentId = isWorkflowRoute ? pathSegments[1] : undefined;
  const stepSlug = isWorkflowRoute ? pathSegments[2] : undefined;
  const hasSteps = isWorkflowRoute ? (steps.length > 0 && isInitialized) : false;
  

  
  const [connectionStates, setConnectionStates] = useState<Map<number, ConnectionState>>(new Map());
  const [chatMessages, setChatMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [threadIds, setThreadIds] = useState<Map<number, string>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [handoffTypingStates, setHandoffTypingStates] = useState<Map<number, boolean>>(new Map());
  const [pendingActivityLogs, setPendingActivityLogs] = useState<Map<number, ActivityData[]>>(new Map());
  
  const hubRef = useRef<AgentSDK | null>(null);
  const processedHistoricalMessages = useRef<Set<string>>(new Set());
  const handoffNavigationTimeout = useRef<number | null>(null);
  const handoffTypingTimers = useRef<Map<number, number>>(new Map());
  const isWebSocketInitialized = useRef<boolean>(false);
  
  // Cache for loaded module agents
  const agentsCache = useRef<any[] | null>(null);
  const agentsCacheModuleSlug = useRef<string | null>(null);
  
  // Dynamic helper functions that work with any module
  const getAgentsForCurrentModule = useCallback(async () => {
    // Use cache if available and for same module
    if (agentsCache.current && agentsCacheModuleSlug.current === moduleSlug) {
      return agentsCache.current;
    }
    
    try {
      const module = getModuleBySlug(moduleSlug);
      if (!module) return [];
      
      const { Agents } = await module.stepsLoader();
      
      // Update cache
      agentsCache.current = Agents;
      agentsCacheModuleSlug.current = moduleSlug;
      
      return Agents;
    } catch (error) {
      console.warn('Failed to load agents for module:', moduleSlug, error);
      return [];
    }
  }, [moduleSlug]);

  const getAgentById = useCallback(async (botId: string) => {
    const agents = await getAgentsForCurrentModule();
    return agents.find((agent: any) => agent.id === botId) || null;
  }, [getAgentsForCurrentModule]);

  const getAgentForStep = useCallback(async (stepIndex: number) => {
    if (!hasSteps || stepIndex < 0 || stepIndex >= steps.length) return null;
    const step = steps[stepIndex];
    if (!step?.botId) return null;
    return await getAgentById(step.botId);
  }, [steps, hasSteps, getAgentById]);

  const getStepIndexFromHandoffMessage = useCallback(async (message: { text: string; data?: any; workflowId?: string }) => {
    try {
      const agents = await getAgentsForCurrentModule();
      
      // Extract workflowId from various possible locations
      const workflowId = message.workflowId || 
                        message.data?.workflowId || 
                        message.data?.WorkflowId || 
                        message.data?.metadata?.workflowId ||
                        message.data?.metadata?.WorkflowId ||
                        message.data?.targetWorkflowId ||
                        message.data?.TargetWorkflowId ||
                        message.data?.handoffTo ||
                        message.data?.HandoffTo;
      
      if (!workflowId) {
        console.warn('[WebSocketStepsContext] No workflowId found in handoff message');
        return null;
      }
      
      // Find matching agent
      const targetAgent = agents.find((agent: any) => 
        agent.workflowType === workflowId ||
        agent.workflowType?.includes(workflowId) ||
        agent.workflowType?.endsWith(workflowId)
      );
      
      if (!targetAgent) {
        console.warn(`[WebSocketStepsContext] No agent found for workflowId: ${workflowId}`);
        return null;
      }
      
      // Find step index for this agent
      const stepIndex = steps.findIndex(step => step.botId === targetAgent.id);
      return stepIndex >= 0 ? stepIndex : null;
      
    } catch (error) {
      console.error('[WebSocketStepsContext] Error in getStepIndexFromHandoffMessage:', error);
      return null;
    }
  }, [getAgentsForCurrentModule, steps]);
  
  // Refs for current values to avoid stale closures in event handlers
  const activeStepRef = useRef<number | null>(null);
  const addChatMessageRef = useRef<any>(null);
  const setHandoffTypingRef = useRef<any>(null);
  const refreshChatHistoryForStepRef = useRef<any>(null);
  const getTargetStepFromHandoffMessageRef = useRef<any>(null);
  const addActivityLogRef = useRef<any>(null);
  const clearActivityLogsRef = useRef<any>(null);
  const setActiveStepRef = useRef<any>(null);

  // Settings tracking refs
  const lastSettingsRef = useRef<string>('');

  // Helper function to get workflowType from stepIndex
  const getWorkflowTypeForStep = useCallback(async (stepIndex: number): Promise<string | null> => {
    if (!hasSteps || stepIndex < 0 || stepIndex >= steps.length) return null;
    const step = steps[stepIndex];
    if (!step?.botId) return null;
    const agent = await getAgentById(step.botId);
    return agent?.workflowType || null;
  }, [steps, hasSteps, getAgentById]);

  // Helper function to get chat messages for a specific step
  const getChatMessagesForStep = useCallback((stepIndex: number): ChatMessage[] => {
    // This is synchronous but workflowType lookup is async - we'll use a cached approach
    if (!hasSteps || stepIndex < 0 || stepIndex >= steps.length) return [];
    const step = steps[stepIndex];
    if (!step?.botId) return [];
    
    // Try to get agent from cache first
    let agent = agentsCache.current?.find((a: any) => a.id === step.botId);
    
    // If not in cache, we can't get the workflowType synchronously
    // This will be resolved when the cache is populated
    if (!agent) {
      console.log(`[WebSocketStepsContext] Agent not in cache for step ${stepIndex}, botId: ${step.botId}`);
      return [];
    }
    
    const workflowType = agent?.workflowType;
    if (!workflowType) {
      console.log(`[WebSocketStepsContext] No workflowType for agent: ${step.botId}`);
      return [];
    }
    
    return chatMessages.get(workflowType) || [];
  }, [chatMessages, steps, hasSteps]);

  // Helper functions for message management
  const addChatMessage = useCallback(async (message: ChatMessage) => {
    // Get workflowType for this message - ensure agents are loaded first
    let workflowType: string | null = null;
    
    if (hasSteps && message.stepIndex >= 0 && message.stepIndex < steps.length) {
      const step = steps[message.stepIndex];
      if (step?.botId) {
        // Ensure agents are loaded
        const agents = await getAgentsForCurrentModule();
        const agent = agents.find((a: any) => a.id === step.botId);
        workflowType = agent?.workflowType || null;
      }
    }
    
    if (!workflowType) {
      console.warn(`[WebSocketStepsContext] No workflowType found for step ${message.stepIndex}, skipping message`);
      return;
    }

    // Prevent duplicate historical messages
    if (message.isHistorical) {
      const messageKey = `${message.id || message.text}-${message.timestamp}-${workflowType}`;
      if (processedHistoricalMessages.current.has(messageKey)) {
        console.log(`[WebSocketStepsContext] Skipping duplicate historical message: ${messageKey}`);
        return;
      }
      processedHistoricalMessages.current.add(messageKey);
      
      // Limit historical message cache size to prevent memory leaks
      if (processedHistoricalMessages.current.size > 1000) {
        const oldMessages = Array.from(processedHistoricalMessages.current).slice(0, 500);
        oldMessages.forEach(msg => processedHistoricalMessages.current.delete(msg));
      }
    }

    setChatMessages(prevMessages => {
      const newMessagesMap = new Map(prevMessages);
      const existingMessages = newMessagesMap.get(workflowType) || [];
      
      // Check for duplicate messages with safe timestamp comparison
      const isDuplicate = existingMessages.some(existing => {
        // ID-based comparison
        if (existing.id === message.id) {
          return true;
        }
        
        // Content and time-based comparison with safe timestamp handling
        if (existing.text === message.text) {
          try {
            const existingTime = existing.timestamp instanceof Date 
              ? existing.timestamp.getTime() 
              : new Date(existing.timestamp).getTime();
            const messageTime = message.timestamp instanceof Date 
              ? message.timestamp.getTime() 
              : new Date(message.timestamp).getTime();
            
            // Consider messages within 1 second as duplicates
            return Math.abs(existingTime - messageTime) < 1000;
          } catch (error) {
            console.warn('[WebSocketStepsContext] Error comparing timestamps:', error);
            // Fall back to text-only comparison if timestamp parsing fails
            return true;
          }
        }
        
        return false;
      });
      
      if (isDuplicate) {
        console.log(`[WebSocketStepsContext] Skipping duplicate message for workflowType ${workflowType}`);
        return prevMessages;
      }
      
      // Store message by workflowType for shared chat history
      newMessagesMap.set(workflowType, [...existingMessages, message]);
      console.log(`[WebSocketStepsContext] Added message to shared chat for workflowType: ${workflowType}`);
      return newMessagesMap;
    });

    if (message.threadId) {
      setThreadIds(prev => new Map(prev).set(message.stepIndex, message.threadId!));
    }
  }, [hasSteps, steps, getAgentsForCurrentModule]);

  const getThreadId = useCallback((stepIndex: number): string | undefined => {
    return threadIds.get(stepIndex);
  }, [threadIds]);
  
  // Helper function to determine target step index from handoff message
  const getTargetStepFromHandoffMessage = useCallback(async (message: ChatMessage): Promise<number | null> => {
    console.log(`[WebSocketStepsContext] 🔍 Processing handoff message for target step detection`);
    
    // Extract workflowId from the message data - check multiple possible locations
    const workflowId = message.data?.workflowId || 
                      message.data?.WorkflowId || 
                      message.data?.metadata?.workflowId ||
                      message.data?.metadata?.WorkflowId ||
                      message.data?.targetWorkflowId ||
                      message.data?.TargetWorkflowId ||
                      message.data?.handoffTo ||
                      message.data?.HandoffTo ||
                      (message as any).workflowId ||  // Check top-level message
                      (message as any).WorkflowId;
    
    console.log(`[WebSocketStepsContext] 🎯 Extracted workflowId:`, workflowId);
    
    // Delegate to the step-specific utility function
    const result = await getStepIndexFromHandoffMessage({
      text: message.text,
      data: message.data,
      workflowId: workflowId
    });
    
    console.log(`[WebSocketStepsContext] 📍 Step mapping result:`, result);
    return result;
  }, [getStepIndexFromHandoffMessage]);

  // Helper function to set handoff typing state for a specific step
  const setHandoffTyping = useCallback((stepIndex: number, isTyping: boolean) => {
    // Clean up any existing timer for this step when manually setting typing state
    const existingTimer = handoffTypingTimers.current.get(stepIndex);
    if (existingTimer) {
      clearTimeout(existingTimer);
      handoffTypingTimers.current.delete(stepIndex);
    }
    
    setHandoffTypingStates(prev => {
      const newMap = new Map(prev);
      if (isTyping) {
        newMap.set(stepIndex, true);
      } else {
        newMap.delete(stepIndex);
      }
      return newMap;
    });
  }, []);

  // Helper function to add ActivityLog data for a specific step
  const addActivityLog = useCallback((stepIndex: number, activityData: ActivityData) => {
    console.log(`[WebSocketStepsContext] 🔸 Adding ActivityLog for step ${stepIndex}:`, activityData.summary);
    setPendingActivityLogs(prev => {
      const newMap = new Map(prev);
      const existingActivities = newMap.get(stepIndex) || [];
      const newActivity = {
        ...activityData,
        id: activityData.id || `${Date.now()}-${Math.random()}`
      };
      newMap.set(stepIndex, [...existingActivities, newActivity]);
      console.log(`[WebSocketStepsContext] 🔸 Step ${stepIndex} now has ${newMap.get(stepIndex)?.length} pending activities`);
      return newMap;
    });
  }, []);

  // Helper function to clear ActivityLog data for a specific step
  const clearActivityLogs = useCallback((stepIndex: number) => {
    console.log(`[WebSocketStepsContext] 🧹 Clearing ActivityLog for step ${stepIndex}`);
    setPendingActivityLogs(prev => {
      const newMap = new Map(prev);
      const clearedCount = newMap.get(stepIndex)?.length || 0;
      newMap.delete(stepIndex);
      console.log(`[WebSocketStepsContext] 🧹 Cleared ${clearedCount} activities for step ${stepIndex}`);
      return newMap;
    });
  }, []);

  // Helper function to refresh chat history for a step
  const refreshChatHistoryForStep = useCallback(async (targetStepIndex: number) => {
    const hub = hubRef.current;
    if (!hub || targetStepIndex < 0 || targetStepIndex >= steps.length) {
      return;
    }
    
    const targetStep = steps[targetStepIndex];
    if (!targetStep?.botId) {
      return;
    }
    
    const targetAgent = await getAgentById(targetStep.botId);
    if (!targetAgent) {
      return;
    }
    
    try {
      console.log(`[WebSocketStepsContext] Refreshing chat history for step ${targetStepIndex} (${targetStep.title})`);
      
      // Show typing indicator for the target step
      setHandoffTyping(targetStepIndex, true);
      console.log(`[WebSocketStepsContext] 💬 Showing handoff typing indicator for step ${targetStepIndex}`);
      
      // Check if there's an active connection for this agent
      if (!targetAgent.workflowType) {
        console.warn(`[WebSocketStepsContext] Agent has no workflowType: ${targetAgent.id}`);
        return;
      }
      
      const connectionState = hub.getAgentConnectionStateByWorkflowType(targetAgent.workflowType);
      
      if (connectionState?.status === 'connected') {
        try {
          console.log(`[WebSocketStepsContext] 🔄 Agent ${targetAgent.workflowId} is connected, requesting fresh thread history`);
          
          // Use the clean SDK API to request thread history refresh
          const success = await hub.refreshThreadHistory(targetAgent.workflowType);
          
          if (success) {
            console.log(`[WebSocketStepsContext] ✅ Successfully requested thread history for step ${targetStepIndex}`);
            
            // Hide typing indicator after a short delay to allow messages to arrive
            setTimeout(() => {
              setHandoffTyping(targetStepIndex, false);
              console.log(`[WebSocketStepsContext] 💬 Hiding handoff typing indicator for step ${targetStepIndex} after history refresh`);
            }, 1500);
          } else {
            console.warn(`[WebSocketStepsContext] Failed to request thread history for step ${targetStepIndex}, using timeout fallback`);
            setTimeout(() => setHandoffTyping(targetStepIndex, false), 2000);
          }
          
        } catch (historyError) {
          console.warn(`[WebSocketStepsContext] Failed to request thread history for step ${targetStepIndex}:`, historyError);
          // Fall back to timeout-based hiding
          setTimeout(() => setHandoffTyping(targetStepIndex, false), 2000);
        }
      } else {
        console.warn(`[WebSocketStepsContext] Agent ${targetAgent.workflowId} not connected (status: ${connectionState?.status}), using timeout fallback`);
        setTimeout(() => setHandoffTyping(targetStepIndex, false), 2000);
      }
      
    } catch (error) {
      console.error(`[WebSocketStepsContext] Error refreshing chat history for step ${targetStepIndex}:`, error);
      // Hide typing indicator on error
      setHandoffTyping(targetStepIndex, false);
    }
  }, [steps, setHandoffTyping, getAgentById]);
  
  // Effect to pre-populate agents cache when module/steps change
  useEffect(() => {
    const populateAgentsCache = async () => {
      if (moduleSlug && steps.length > 0) {
        try {
          const agents = await getAgentsForCurrentModule();
          console.log(`[WebSocketStepsContext] Populated agents cache with ${agents.length} agents for module: ${moduleSlug}`);
        } catch (error) {
          console.warn('[WebSocketStepsContext] Failed to populate agents cache:', error);
        }
      }
    };
    
    populateAgentsCache();
  }, [moduleSlug, steps.length, getAgentsForCurrentModule]);

  // Update refs with current values to avoid stale closures in event handlers
  useEffect(() => {
    activeStepRef.current = activeStep;
    addChatMessageRef.current = addChatMessage;
    setHandoffTypingRef.current = setHandoffTyping;
    refreshChatHistoryForStepRef.current = refreshChatHistoryForStep;
    getTargetStepFromHandoffMessageRef.current = getTargetStepFromHandoffMessage;
    addActivityLogRef.current = addActivityLog;
    clearActivityLogsRef.current = clearActivityLogs;
    setActiveStepRef.current = setActiveStep;
  }, [activeStep, addChatMessage, setHandoffTyping, refreshChatHistoryForStep, getTargetStepFromHandoffMessage, addActivityLog, clearActivityLogs, setActiveStep]);
  
  // Effect to create and manage the WebSocketHub instance and its listeners
  useEffect(() => {
    // For workflow routes, wait for steps to be loaded before initializing WebSocket
    if (isWorkflowRoute && !isInitialized) {
      console.log('[WebSocketStepsContext] Workflow route detected but steps not yet loaded, waiting...', { 
        stepsLength: steps.length, 
        isInitialized,
        isWorkflowRoute,
        hasSteps
      });
      return;
    }
    
    // For dashboard routes, we can initialize WebSocket even without steps
    if (!isWorkflowRoute) {
      console.log('[WebSocketStepsContext] Initializing for dashboard route (no steps required):', { 
        stepsLength: steps.length, 
        isInitialized, 
        isWorkflowRoute 
      });
    } else {
      console.log('[WebSocketStepsContext] Initializing for workflow route with steps loaded:', { 
        stepsLength: steps.length, 
        isInitialized, 
        isWorkflowRoute 
      });
    }
    
    // Check if we have valid settings for WebSocket connection
    const hasValidSettings = settings.agentWebsocketUrl && 
                            (settings.Authorization || settings.agentApiKey) && 
                            settings.tenantId && 
                            settings.participantId;
    
    if (!hasValidSettings) {
      console.log('[WebSocketStepsContext] Not initializing - settings not ready:', {
        hasWebsocketUrl: !!settings.agentWebsocketUrl,
        hasAuth: !!(settings.Authorization || settings.agentApiKey),
        hasTenantId: !!settings.tenantId,
        hasParticipantId: !!settings.participantId
      });
      return;
    }
    
    // Calculate settings hash and check if they've changed
    const essentialSettings = {
      agentWebsocketUrl: settings.agentWebsocketUrl,
      Authorization: settings.Authorization || settings.agentApiKey,
      tenantId: settings.tenantId,
      participantId: settings.participantId
    };
    const currentSettingsHash = JSON.stringify(essentialSettings);
    const settingsChanged = lastSettingsRef.current !== currentSettingsHash;
    
    // Skip re-initialization if WebSocket is already set up and settings haven't changed
    if (isWebSocketInitialized.current && hubRef.current && !settingsChanged) {
      console.log('[WebSocketStepsContext] WebSocket already initialized with current settings, skipping re-initialization');
      return;
    }
    
    // Log settings change if applicable
    if (settingsChanged) {
      console.log('[WebSocketStepsContext] Settings changed, will re-initialize:', {
        from: lastSettingsRef.current || '(empty)',
        to: currentSettingsHash
      });
      lastSettingsRef.current = currentSettingsHash;
    }
    
    console.log('[WebSocketStepsContext] Initializing WebSocket connections with valid settings...');
    
    // Pre-load agents for current module if available
    const initializeAgentsCache = async () => {
      if (moduleSlug) {
        try {
          const agents = await getAgentsForCurrentModule();
          console.log(`[WebSocketStepsContext] Pre-loaded ${agents.length} agents for module: ${moduleSlug}`);
        } catch (error) {
          console.warn('[WebSocketStepsContext] Failed to pre-load agents:', error);
        }
      }
    };
    
    // Initialize agents cache before setting up WebSocket
    initializeAgentsCache();
    
    // Try to get existing shared SDK or initialize one with proper settings
    let sdk: AgentSDK;
    try {
      sdk = AgentSDK.getShared();
      console.log('[WebSocketStepsContext] Using existing shared SDK instance');
    } catch {
      // Initialize shared SDK with validated settings
      console.log('[WebSocketStepsContext] Initializing shared SDK instance with settings:', {
        agentWebsocketUrl: settings.agentWebsocketUrl,
        hasAuth: !!(settings.Authorization || settings.agentApiKey),
        tenantId: settings.tenantId,
        participantId: settings.participantId
      });
      
      // Try to trigger DocumentService initialization first for proper SDK setup
      try {
        // Use dynamic import to avoid circular dependencies
        import('../modules/poa/services/DocumentService').then(({ DocumentService }) => {
          try {
            DocumentService.getInstance();
            console.log('[WebSocketStepsContext] DocumentService initialized successfully');
          } catch (initError) {
            console.warn('[WebSocketStepsContext] DocumentService initialization failed:', initError);
          }
        }).catch((importError) => {
          console.warn('[WebSocketStepsContext] Could not import DocumentService:', importError);
        });
      } catch (docServiceError) {
        console.warn('[WebSocketStepsContext] DocumentService setup failed:', docServiceError);
      }
      
      // Create our own shared SDK instance
      sdk = AgentSDK.initShared({
        agentWebsocketUrl: settings.agentWebsocketUrl,
        Authorization: settings.Authorization || settings.agentApiKey || '',
        tenantId: settings.tenantId,
        participantId: settings.participantId,
        getDefaultData: () => {
          return settings.defaultMetadata || undefined;
        }
      });
    }
    const hub = sdk;
    hubRef.current = hub;

    const workflowIdToStepIndex = async (workflowId: string): Promise<number> => {
      // If no steps available (dashboard route), return 0 as default
      if (!hasSteps || steps.length === 0) {
        console.log(`[WebSocketStepsContext] No steps available, using default step index 0 for workflowId "${workflowId}"`);
        return 0;
      }
      
      // Ensure agents are loaded
      const agents = await getAgentsForCurrentModule();
      
      // Find all steps that match this workflowType
      const matchingSteps: number[] = [];
      steps.forEach((step, index) => {
        if (!step.botId) return;
        const agent = agents.find((a: any) => a.id === step.botId);
        if (agent?.workflowType === workflowId) {
          matchingSteps.push(index);
        }
      });
      
      console.log(`[WebSocketStepsContext] Found ${matchingSteps.length} steps matching workflowId "${workflowId}": [${matchingSteps.join(', ')}]`);
      
      // If multiple steps share the same workflowType, route to the active step if it's one of them
      if (matchingSteps.length > 1 && activeStepRef.current !== null && matchingSteps.includes(activeStepRef.current)) {
        console.log(`[WebSocketStepsContext] Multiple steps found, routing to active step: ${activeStepRef.current}`);
        return activeStepRef.current;
      }
      
      // Otherwise, use the first matching step (original behavior)
      const stepIndex = matchingSteps.length > 0 ? matchingSteps[0] : 0;
      console.log(`[WebSocketStepsContext] Mapping workflowId "${workflowId}" to step index: ${stepIndex}`);
      return stepIndex;
    };

    const handleConnectionChange = async (ev: { workflowId: string; data: ConnectionState }) => {
      // If no steps available (dashboard route), still update global connection state
      if (!hasSteps || steps.length === 0) {
        console.log(`[WebSocketStepsContext] Connection change for workflowId "${ev.workflowId}" (no steps to update)`);
        setIsConnected(ev.data.status === 'connected');
        return;
      }
      
      // Ensure agents are loaded
      const agents = await getAgentsForCurrentModule();
      
      // Find all steps that use this workflowType and update their connection states
      const matchingSteps: number[] = [];
      steps.forEach((step, index) => {
        if (!step.botId) return;
        const agent = agents.find((a: any) => a.id === step.botId);
        if (agent?.workflowType === ev.workflowId) {
          matchingSteps.push(index);
        }
      });
      
      console.log(`[WebSocketStepsContext] Connection change for workflowId "${ev.workflowId}", updating ${matchingSteps.length} steps: [${matchingSteps.join(', ')}]`);
      
      setConnectionStates(prevStates => {
        const map = new Map(prevStates);
        // Update connection state for all matching steps
        matchingSteps.forEach(stepIndex => {
          map.set(stepIndex, { ...ev.data, stepIndex });
        });
        return map;
      });
      
      // Update global connection state
      setIsConnected(prevConnected => {
        const newConnected = Array.from(connectionStates.values()).some(state => state.status === 'connected');
        if (newConnected !== prevConnected) {
          console.log(`[WebSocketStepsContext] Connection state changed: ${newConnected}`);
        }
        return newConnected;
      });
    };

    const handleMessage = async (ev: { workflowId: string; data: any }) => {
      const raw = ev.data;
      const stepIndex = await workflowIdToStepIndex(ev.workflowId);
      const chatMessage: ChatMessage = {
        ...raw,
        stepIndex
      } as ChatMessage;
      
      console.log(`[WebSocketStepsContext] 📨 Received message for step ${stepIndex} (workflowId: ${ev.workflowId}), direction: ${chatMessage.direction}, isHistorical: ${chatMessage.isHistorical}`);
      
      // If this is an outgoing (agent) message, attach any pending ActivityLog data
      if (!chatMessage.isHistorical && chatMessage.direction === 'Outgoing') {
        // Use state setter to access current pendingActivityLogs (to avoid stale closures)
        setPendingActivityLogs(prev => {
          const pendingActivities = prev.get(stepIndex) || [];
          console.log(`[WebSocketStepsContext] 🔍 Processing outgoing message for step ${stepIndex}:`, {
            messageText: chatMessage.text.substring(0, 50) + '...',
            pendingActivitiesCount: pendingActivities.length,
            pendingActivities: pendingActivities,
            currentActiveStep: activeStep
          });
          
          if (pendingActivities.length > 0) {
            console.log(`[WebSocketStepsContext] 📋 Attaching ${pendingActivities.length} ActivityLog entries to outgoing message for step ${stepIndex}`);
            chatMessage.activityLog = [...pendingActivities];
            
            console.log(`[WebSocketStepsContext] ✅ ActivityLog attached:`, chatMessage.activityLog);
            
            // Clear pending ActivityLog data since it's now attached to the message
            const newMap = new Map(prev);
            console.log(`[WebSocketStepsContext] 🔗 Clearing ${pendingActivities.length} pending activities for step ${stepIndex} after attachment`);
            newMap.delete(stepIndex);
            
            // Handle handoff typing clearing immediately since processing is complete
            console.log(`[WebSocketStepsContext] 💬 Clearing handoff typing immediately for step ${chatMessage.stepIndex} - ActivityLog attached`);
            setHandoffTypingRef.current?.(chatMessage.stepIndex, false);
            
            return newMap;
          } else {
            console.log(`[WebSocketStepsContext] ℹ️ No pending ActivityLog data for step ${stepIndex}`);
            
            // Handle handoff typing clearing with delay if no ActivityLog was attached
            console.log(`[WebSocketStepsContext] 💬 Clearing handoff typing with delay for step ${chatMessage.stepIndex} - no ActivityLog`);
            const timerId = setTimeout(() => {
              console.log(`[WebSocketStepsContext] 💬 Clearing handoff typing indicator for step ${chatMessage.stepIndex} after delay`);
              setHandoffTypingRef.current?.(chatMessage.stepIndex, false);
              handoffTypingTimers.current.delete(chatMessage.stepIndex);
            }, 1000); // Shorter 1 second delay for cases without ActivityLog
            handoffTypingTimers.current.set(chatMessage.stepIndex, timerId);
            
            return prev; // No changes to pending activities
          }
        });
      }
      
      // Always add the message to chat history
      try {
        await addChatMessageRef.current?.(chatMessage);
      } catch (error) {
        console.warn('[WebSocketStepsContext] Error adding chat message:', error);
      }
    };

    const handleHandoff = async (handoff: any) => {
      console.log(`[WebSocketStepsContext] 🚀 Handoff message received:`, {
        workflowId: handoff.workflowId,
        text: handoff.text,
        isHistorical: handoff.isHistorical,
        currentStep: activeStepRef.current
      });
      
      // Only process navigation for new handoff messages, not historical ones
      if (handoff.isHistorical) {
        console.log(`[WebSocketStepsContext] 📜 Skipping navigation for historical handoff message`);
        return;
      }
      
      // Clear any existing navigation timeout
      if (handoffNavigationTimeout.current) {
        clearTimeout(handoffNavigationTimeout.current);
      }
      
      // Create a ChatMessage object for getTargetStepFromHandoffMessage
      const handoffChatMessage: ChatMessage = {
        id: `handoff-${Date.now()}-${Math.random()}`,
        text: handoff.text,
        direction: handoff.direction,
        messageType: 'Handoff',
        timestamp: handoff.timestamp,
        stepIndex: await workflowIdToStepIndex(handoff.workflowId),
        threadId: handoff.threadId,
        data: handoff.data,
        isHistorical: handoff.isHistorical
      };
      
      // Determine target step from handoff message
      const targetStepIndexPromise = getTargetStepFromHandoffMessageRef.current?.(handoffChatMessage);
      const targetStepIndex = targetStepIndexPromise ? await targetStepIndexPromise : null;
      
      console.log(`[WebSocketStepsContext] 🧭 Navigation decision: targetStepIndex=${targetStepIndex}, activeStep=${activeStepRef.current}`);
      
      if (targetStepIndex !== null && targetStepIndex !== activeStepRef.current) {
        console.log(`[WebSocketStepsContext] ✅ Initiating navigation to step ${targetStepIndex} due to handoff`);
        
        // Refresh chat history for the target step to get complete conversation context
        refreshChatHistoryForStepRef.current?.(targetStepIndex);
        
        // Navigate to the target step after a short delay to ensure the handoff message is visible
        handoffNavigationTimeout.current = setTimeout(() => {
          console.log(`[WebSocketStepsContext] 🚀 Executing setActiveStep(${targetStepIndex})`);
          setActiveStepRef.current?.(targetStepIndex);
          handoffNavigationTimeout.current = null;
        }, 800); // Reduced delay for better UX
        
      } else if (targetStepIndex === null) {
        console.warn(`[WebSocketStepsContext] ⚠️ Could not determine target step from handoff message`);
      } else {
        console.log(`[WebSocketStepsContext] 🔄 Already on target step ${targetStepIndex}, refreshing chat history`);
        refreshChatHistoryForStepRef.current?.(targetStepIndex);
      }
    };

    const handleError = (event: any) => {
      console.error(`[WebSocketStepsContext] WebSocket error:`, event.data);
    };

    // Set up event listeners
    hub.on('connection_change', handleConnectionChange);
    hub.on('message', handleMessage);
    hub.on('error', handleError);
    
    // Set up dedicated handoff subscription
    const unsubscribeHandoffs = hub.subscribeToHandoffs(handleHandoff);

    // Set up ActivityLog subscription to populate pending ActivityLog data
    const unsubscribeActivityLogs = hub.subscribeToData(
      'websocket-context-activity-logs',
      ['ActivityLog'],
      (message: any) => {
        console.log('[WebSocketStepsContext] 📊 ActivityLog received:', message);
        
        // Extract ActivityLog data
        const activityData = message.messageType === 'ActivityLog' ? message :
                            message.data?.metadata || 
                            message.metadata || 
                            message.data?.Metadata || 
                            message.Metadata ||
                            message.data;
        
        if (activityData && activityData.messageType === 'ActivityLog') {
          // Add to pending ActivityLog for the current active step
          if (activeStepRef.current !== null) {
            console.log('[WebSocketStepsContext] 📋 Adding ActivityLog to pending list for step:', activeStepRef.current);
            
            addActivityLogRef.current?.(activeStepRef.current, {
              summary: activityData.summary,
              details: activityData.details,
              success: activityData.success,
              timestamp: activityData.timestamp,
              id: `${Date.now()}-${Math.random()}`
            });
            
            // Note: We don't clear the ActivityLog here anymore - it will be attached to the next outgoing message
            // and cleared when that happens in handleMessage()
          } else {
            console.warn('[WebSocketStepsContext] ⚠️ No active step available for ActivityLog:', activityData.summary);
          }
        } else {
          console.warn('[WebSocketStepsContext] ⚠️ Invalid ActivityLog data:', activityData);
        }
      }
    );

    console.log('[WebSocketStepsContext] Event listeners, handoff subscription, and ActivityLog subscription attached');
    
    // Mark as successfully initialized
    isWebSocketInitialized.current = true;

    // Cleanup function
    return () => {
      console.log('[WebSocketStepsContext] Cleaning up event listeners and subscriptions');
      
      // Mark as no longer initialized
      isWebSocketInitialized.current = false;
      
      // Clear navigation timeout
      if (handoffNavigationTimeout.current) {
        clearTimeout(handoffNavigationTimeout.current);
        handoffNavigationTimeout.current = null;
      }
      
      // Clear all handoff typing timers
      handoffTypingTimers.current.forEach((timerId) => {
        clearTimeout(timerId);
      });
      handoffTypingTimers.current.clear();
      
      // Cleanup event listeners
      hub.off('connection_change', handleConnectionChange);
      hub.off('message', handleMessage);
      hub.off('error', handleError);
      
      // Cleanup handoff subscription
      unsubscribeHandoffs();
      
      // Cleanup ActivityLog subscription
      unsubscribeActivityLogs();
      
      hubRef.current = null;
    };
  }, [steps, isInitialized, settings.agentWebsocketUrl, settings.Authorization, settings.agentApiKey, settings.tenantId, settings.participantId, isWorkflowRoute, hasSteps, getAgentById, getWorkflowTypeForStep, getStepIndexFromHandoffMessage, refreshChatHistoryForStep, setHandoffTyping, addActivityLog, clearActivityLogs, setActiveStep, moduleSlug, location.pathname]);

  // sendMessage using the new architecture
  const sendMessage = useCallback(async (text: string, data?: any, targetStepIndex?: number) => {
    // Use target step if provided, otherwise use activeStepRef (which has the current value)
    let stepIndex = targetStepIndex !== undefined ? targetStepIndex : activeStepRef.current;
    
    // If we're on a step route but activeStepRef is still 0, try to get from URL as fallback
    const currentUrl = window.location.pathname;
    const isOnStepRoute = currentUrl.includes('/poa/') && !currentUrl.endsWith('/poa');
    
    if ((stepIndex === null || (stepIndex === 0 && isOnStepRoute)) && hasSteps) {
      try {
        // Get the current URL step from window.location
        const stepSlugMatch = currentUrl.match(/\/([^/]+)$/); // Get last segment of URL
        if (stepSlugMatch && stepSlugMatch[1]) {
          const stepSlug = stepSlugMatch[1];
          const foundIndex = steps.findIndex(step => step.slug === stepSlug);
          if (foundIndex >= 0) {
            stepIndex = foundIndex;
            console.log(`[WebSocketStepsContext] 🔄 Corrected step index from URL: ${stepSlug} → ${stepIndex} (was ${activeStepRef.current})`);
          }
        }
      } catch (error) {
        console.warn('[WebSocketStepsContext] Failed to get step from URL:', error);
      }
    }
    
    // Default to 0 if we still don't have a valid step index
    if (stepIndex === null) {
      stepIndex = 0;
      console.log('[WebSocketStepsContext] Defaulting to step index 0');
    }
    
    console.log(`[WebSocketStepsContext] sendMessage called with:`, {
      targetStepIndex,
      calculatedStepIndex: stepIndex,
      localActiveStep: activeStep,
      activeStepRefCurrent: activeStepRef.current,
      hasSteps,
      stepsLength: steps.length
    });
    
    if (!hasSteps && stepIndex !== 0) {
      console.warn(`[WebSocketStepsContext] sendMessage called but no steps available (stepIndex: ${stepIndex})`);
      return;
    }

    if (hasSteps) {
      const step = steps[stepIndex];
      if (!step?.botId) {
        console.warn(`[WebSocketStepsContext] No bot configured for step ${stepIndex}. Available steps:`, steps.map((s, i) => `${i}: ${s.title} (botId: ${s.botId})`));
        return;
      }

      const agent = await getAgentForStep(stepIndex);
      if (!agent) {
        console.warn(`[WebSocketStepsContext] Agent not found for step ${stepIndex}`);
        return;
      }

      console.log(`[WebSocketStepsContext] 🎯 Sending message to step ${stepIndex} (${step.title}) agent: ${agent.id}`);

      // Add user message to local chat history immediately (local echo)
      if (!data && text) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}-${Math.random()}`,
          text: text,
          direction: 'Incoming',
          messageType: 'Chat',
          timestamp: new Date(),
          stepIndex: stepIndex, // Use the target step for proper message routing
          threadId: getThreadId(stepIndex),
          isHistorical: false // Explicitly mark as new for highlighting
        };
        await addChatMessage(userMessage);
      }

      const sdk = hubRef.current!;
      if (data) {
        await sdk.sendData(agent.workflowType!, data);
      } else {
        await sdk.sendChat(agent.workflowType!, text);
      }
    } else {
      console.warn(`[WebSocketStepsContext] Cannot send message - no steps available for stepIndex: ${stepIndex}`);
    }
  }, [hasSteps, steps, addChatMessage, getThreadId, getAgentForStep]);

  // Data subscription methods
  const subscribeToData = useCallback((subscriberId: string, messageTypes: string[], callback: (message: any) => void, _stepIndex?: number) => {
    const sdk = hubRef.current;
    if (!sdk) return () => {};
    return sdk.subscribeToData(subscriberId, messageTypes, callback);
  }, []);

  const unsubscribeFromData = useCallback((subscriberId: string) => {
    hubRef.current?.unsubscribeFromData(subscriberId);
  }, []);

  // Chat message subscription method
  const subscribeToChatMessages = useCallback((callback: (chat: any) => void) => {
    const sdk = hubRef.current;
    if (!sdk) return () => {};
    return sdk.subscribeToChatMessages(callback);
  }, []);

  // Handoff subscription method
  const subscribeToHandoffs = useCallback((callback: (handoff: any) => void) => {
    const sdk = hubRef.current;
    if (!sdk) return () => {};
    return sdk.subscribeToHandoffs(callback);
  }, []);

  // Manual connect/disconnect for context consumers
  const manualConnect = useCallback(async () => {
    // SDK connects elsewhere – nothing to do.
  }, []);

  const manualDisconnect = useCallback(async () => {
    // Not supported – ignore
  }, []);

  // Get statistics from all components
  const getStats = useCallback(() => {
    const hub = hubRef.current;
    
    // Calculate message store stats directly from React state
    const messageStoreStats = {
      totalWorkflowTypes: Array.from(new Set([...chatMessages.keys()])).length,
      totalChatMessages: Array.from(chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      workflowTypeStats: Array.from(new Set([...chatMessages.keys()])).reduce((acc, workflowType) => {
        acc[workflowType] = {
          chat: chatMessages.get(workflowType)?.length || 0
        };
        return acc;
      }, {} as Record<string, { chat: number }>)
    };
    
    return {
      hub: hub?.getStats() || null,
      messageStore: messageStoreStats,
      context: {
        isConnected,
        connectionStatesCount: connectionStates.size
      }
    };
  }, [isConnected, connectionStates, chatMessages]);
  
  const value: WebSocketStepsContextType = {
    connectionStates,
    isConnected,
    chatMessages,
    getChatMessagesForStep,
    handoffTypingStates,
    activityLogStates: pendingActivityLogs,
    connect: manualConnect,
    disconnect: manualDisconnect,
    sendMessage,
    setHandoffTyping,
    addActivityLog,
    clearActivityLogs,
    subscribeToData,
    unsubscribeFromData,
    subscribeToChatMessages,
    subscribeToHandoffs,
    getStats
  };
  
  return (
    <WebSocketStepsContext.Provider value={value}>
      {children}
    </WebSocketStepsContext.Provider>
  );
}; 