import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ActivityData, ConnectionState } from '../../types';
import { useSteps } from '../StepsContext';
import { useSettings } from '../SettingsContext';
import { useLocation } from 'react-router-dom';
import { 
  WebSocketStepsContextType, 
  WebSocketProviderProps
} from './types';
import { AgentManager } from './AgentManager';
import { MessageManager } from './MessageManager';
import { ConnectionManager } from './ConnectionManager';
import { ActivityLogManager } from './ActivityLogManager';
import { HandoffManager } from './HandoffManager';

export const WebSocketStepsContext = createContext<WebSocketStepsContextType | null>(null);

export const WebSocketStepsProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // Location and module info
  const location = useLocation();
  const moduleSlug = location.pathname.split('/')[1];
  
  // Steps context (optional for dashboard routes)
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
    console.log('[WebSocketStepsContext] StepsContext not available, using defaults');
  }
  
  const { settings } = useSettings();
  
  // Route analysis
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isWorkflowRoute = pathSegments.length >= 3;
  const documentId = isWorkflowRoute ? pathSegments[1] : undefined;
  const stepSlug = isWorkflowRoute ? pathSegments[2] : undefined;
  const hasValidWorkflowParams = Boolean(isWorkflowRoute && documentId && stepSlug);
  const hasSteps = isWorkflowRoute ? (steps.length > 0 && isInitialized) : false;
  
  // Manager instances (created once and reused)
  const agentManagerRef = useRef<AgentManager | null>(null);
  const messageManagerRef = useRef<MessageManager | null>(null);
  const connectionManagerRef = useRef<ConnectionManager | null>(null);
  const activityLogManagerRef = useRef<ActivityLogManager | null>(null);
  const handoffManagerRef = useRef<HandoffManager | null>(null);
  
  // Initialize managers
  if (!agentManagerRef.current) {
    agentManagerRef.current = new AgentManager(moduleSlug);
  }
  if (!messageManagerRef.current) {
    messageManagerRef.current = new MessageManager(agentManagerRef.current);
  }
  if (!connectionManagerRef.current) {
    connectionManagerRef.current = new ConnectionManager(agentManagerRef.current);
  }
  if (!activityLogManagerRef.current) {
    activityLogManagerRef.current = new ActivityLogManager();
  }
  if (!handoffManagerRef.current) {
    handoffManagerRef.current = new HandoffManager(agentManagerRef.current, connectionManagerRef.current);
  }
  
  // State from managers
  const [connectionStates, setConnectionStates] = useState<Map<number, ConnectionState>>(new Map());
  const [chatMessages, setChatMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [handoffTypingStates, setHandoffTypingStates] = useState<Map<number, boolean>>(new Map());
  const [activityLogStates, setActivityLogStates] = useState<Map<number, ActivityData[]>>(new Map());
  
  // Helper functions
  const getChatMessagesForStep = useCallback((stepIndex: number): ChatMessage[] => {
    return messageManagerRef.current?.getChatMessagesForStep(stepIndex, steps) || [];
  }, [steps]);
  
  const addChatMessage = useCallback(async (message: ChatMessage) => {
    await messageManagerRef.current?.addChatMessage(message, steps);
    setChatMessages(messageManagerRef.current?.getChatMessages() || new Map());
  }, [steps]);
  
  const addActivityLog = useCallback((stepIndex: number, activityData: ActivityData) => {
    activityLogManagerRef.current?.addActivityLog(stepIndex, activityData);
    setActivityLogStates(activityLogManagerRef.current?.getActivityLogStates() || new Map());
  }, []);
  
  const clearActivityLogs = useCallback((stepIndex: number) => {
    activityLogManagerRef.current?.clearActivityLogs(stepIndex);
    setActivityLogStates(activityLogManagerRef.current?.getActivityLogStates() || new Map());
  }, []);
  
  const setHandoffTyping = useCallback((stepIndex: number, isTyping: boolean) => {
    handoffManagerRef.current?.setHandoffTyping(stepIndex, isTyping);
    setHandoffTypingStates(handoffManagerRef.current?.getHandoffTypingStates() || new Map());
  }, []);
  
  // Refs for avoiding stale closures
  const activeStepRef = useRef<number | null>(null);
  const lastSettingsRef = useRef<string>('');
  const isWebSocketInitialized = useRef<boolean>(false);
  const initializationTimeoutRef = useRef<number | null>(null);
  const stepsRef = useRef<any[]>([]);
  const hasStepsRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  
  // Update refs
  useEffect(() => {
    activeStepRef.current = activeStep;
    stepsRef.current = steps;
    hasStepsRef.current = hasSteps;
    // Update module slug if changed
    if (agentManagerRef.current) {
      agentManagerRef.current.updateModuleSlug(moduleSlug);
    }
  }, [activeStep, moduleSlug, steps, hasSteps]);

  // Helper function to initialize WebSocket
  const initializeWebSocket = useCallback(async () => {
    console.log('[WebSocketStepsContext] Initializing WebSocket connections...');
    
    try {
      // Initialize SDK
      const hub = await connectionManagerRef.current!.initializeSDK(settings);
      
      // Set up event handlers
      const handleConnectionChange = async (ev: { workflowId: string; data: ConnectionState }) => {
        console.log(`[WebSocketStepsContext] Connection change event received for workflowId: ${ev.workflowId}, status: ${ev.data.status}`);
        // Use refs to get current values
        await connectionManagerRef.current!.handleConnectionChange(ev, stepsRef.current, hasStepsRef.current);
        
        // Immediately update React state
        const newConnectionStates = connectionManagerRef.current!.getConnectionStates();
        const newIsConnected = connectionManagerRef.current!.getIsConnected();
        
        console.log(`[WebSocketStepsContext] State update from connection change - isConnected: ${newIsConnected}, connectionStates size: ${newConnectionStates.size}`);
        setConnectionStates(newConnectionStates);
        setIsConnected(newIsConnected);
      };
      
      const handleMessage = async (ev: { workflowId: string; data: any }) => {
        // Use refs to get current values
        const stepIndex = await agentManagerRef.current!.workflowIdToStepIndex(ev.workflowId, stepsRef.current, activeStepRef.current);
        const chatMessage: ChatMessage = {
          ...ev.data,
          stepIndex,
          workflowId: ev.workflowId // Preserve original workflowId for later mapping
        } as ChatMessage;
        
        console.log(`[WebSocketStepsContext] 📨 Received message for step ${stepIndex}`);
        
        // Handle activity log attachment for outgoing messages
        if (!chatMessage.isHistorical && chatMessage.direction === 'Outgoing') {
          const pendingActivities = activityLogManagerRef.current!.extractAndClearPendingActivities(stepIndex);
          if (pendingActivities.length > 0) {
            chatMessage.activityLog = pendingActivities;
            handoffManagerRef.current!.clearHandoffTypingImmediately(stepIndex);
          } else {
            handoffManagerRef.current!.setHandoffTypingWithTimer(stepIndex);
          }
          setActivityLogStates(activityLogManagerRef.current!.getActivityLogStates());
          setHandoffTypingStates(handoffManagerRef.current!.getHandoffTypingStates());
        }
        
        // Use messageManagerRef directly to avoid dependency
        await messageManagerRef.current?.addChatMessage(chatMessage, stepsRef.current);
        setChatMessages(messageManagerRef.current?.getChatMessages() || new Map());
      };
      
      const handleHandoff = async (handoff: any) => {
        // Use refs to get current values
        await handoffManagerRef.current!.handleHandoff(handoff, activeStepRef.current, stepsRef.current, setActiveStep);
      };
      
      const handleError = (event: any) => {
        console.error(`[WebSocketStepsContext] WebSocket error:`, event.data);
      };
      
      // Handle activity log messages directly in the callback
      const handleActivityLogMessage = (message: any) => {
        activityLogManagerRef.current!.handleActivityLogMessage(message, activeStepRef.current, (stepIndex: number, activityData: ActivityData) => {
          activityLogManagerRef.current!.addActivityLog(stepIndex, activityData);
          setActivityLogStates(activityLogManagerRef.current!.getActivityLogStates());
        });
      };
      
      // Attach event listeners
      hub.on('connection_change', handleConnectionChange);
      hub.on('message', handleMessage);
      hub.on('error', handleError);
      
      // Set up subscriptions
      const unsubscribeHandoffs = hub.subscribeToHandoffs(handleHandoff);
      
      const unsubscribeActivityLogs = hub.subscribeToData(
        'websocket-context-activity-logs',
        ['ActivityLog'],
        handleActivityLogMessage
      );
      
      console.log('[WebSocketStepsContext] Event listeners and subscriptions attached');
      isWebSocketInitialized.current = true;
      
      // IMPORTANT: Immediately check and update connection state after initialization
      // This ensures the UI reflects the connected status even if connection_change events weren't fired
      const immediateConnectionUpdate = () => {
        // First, trigger manual connection state update in ConnectionManager
        connectionManagerRef.current!.updateConnectionStatesFromSDK();
        
        // Then, get the updated states and sync with React
        const currentIsConnected = connectionManagerRef.current!.getIsConnected();
        const currentConnectionStates = connectionManagerRef.current!.getConnectionStates();
        
        console.log(`[WebSocketStepsContext] Immediate state check - isConnected: ${currentIsConnected}, connectionStates size: ${currentConnectionStates.size}`);
        console.log(`[WebSocketStepsContext] Connection states detail:`, Array.from(currentConnectionStates.entries()).map(([step, state]) => ({ step, status: state.status })));
        
        // Force React state update immediately
        setIsConnected(currentIsConnected);
        setConnectionStates(new Map(currentConnectionStates)); // Create new Map to trigger re-render
        
        // If we detect the managers think we're connected but React state doesn't reflect it, force update
        if (currentIsConnected) {
          console.log('[WebSocketStepsContext] ✅ Detected successful connection, UI state updated immediately');
        } else {
          console.log('[WebSocketStepsContext] ⚠️ No connection detected yet');
        }
      };
      
      // Call immediately and then also with a delay for redundancy
      immediateConnectionUpdate();
      
      // Also check again after a short delay in case SDK needs time to fully initialize
      setTimeout(immediateConnectionUpdate, 500);
      setTimeout(immediateConnectionUpdate, 1000);
      
      // Cleanup function
      return () => {
        console.log('[WebSocketStepsContext] Cleaning up event listeners and subscriptions');
        isWebSocketInitialized.current = false;
        
        hub.off('connection_change', handleConnectionChange);
        hub.off('message', handleMessage);
        hub.off('error', handleError);
        
        unsubscribeHandoffs();
        unsubscribeActivityLogs();
        
        // Cleanup managers
        handoffManagerRef.current?.cleanup();
      };
      
    } catch (error) {
      console.error('[WebSocketStepsContext] Failed to initialize WebSocket:', error);
      return null;
    }
  }, [settings]); // Only depend on settings, not the changing callback functions
  
  // Main WebSocket initialization effect
  useEffect(() => {
    console.log(`[WebSocketStepsContext] Main effect triggered - isWorkflowRoute: ${isWorkflowRoute}, hasValidWorkflowParams: ${hasValidWorkflowParams}, isInitialized: ${isWebSocketInitialized.current}, isInitializing: ${isInitializingRef.current}`);
    
    // Clear any existing timeout
    if (initializationTimeoutRef.current) {
      window.clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }

    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.log('[WebSocketStepsContext] Initialization already in progress, skipping main effect');
      return;
    }

    // Check if we have valid settings
    if (!connectionManagerRef.current?.hasValidSettings(settings)) {
      console.log('[WebSocketStepsContext] Not initializing - settings not ready');
      return;
    }

    // For workflow routes, check if we have valid route parameters instead of just isInitialized
    // This prevents blocking during navigation between steps when isInitialized is temporarily false
    if (isWorkflowRoute && !hasValidWorkflowParams) {
      console.log('[WebSocketStepsContext] Workflow route detected but missing valid parameters (documentId/stepSlug)');
      return;
    }
    
    // Check if settings changed
    const currentSettingsHash = connectionManagerRef.current.calculateSettingsHash(settings);
    const settingsChanged = lastSettingsRef.current !== currentSettingsHash;
    
    if (isWebSocketInitialized.current && !settingsChanged) {
      console.log('[WebSocketStepsContext] WebSocket already initialized with current settings');
      return;
    }
    
    if (settingsChanged) {
      console.log('[WebSocketStepsContext] Settings changed, will re-initialize');
      lastSettingsRef.current = currentSettingsHash;
      // Reset the initialized flag so we can re-initialize
      isWebSocketInitialized.current = false;
    }
    
    // Initialize immediately for dashboard routes or workflow routes with valid parameters
    if (!isWorkflowRoute || hasValidWorkflowParams) {
      console.log(`[WebSocketStepsContext] MAIN EFFECT: Initializing WebSocket for ${isWorkflowRoute ? 'workflow' : 'dashboard'} route`);
      isInitializingRef.current = true;
      
      const initPromise = initializeWebSocket();
      
      initPromise.then(cleanupFn => {
        isInitializingRef.current = false;
        return cleanupFn;
      }).catch(error => {
        isInitializingRef.current = false;
        console.error('[WebSocketStepsContext] Main effect initialization failed:', error);
      });
      
      return () => {
        isInitializingRef.current = false;
        initPromise.then(cleanupFn => cleanupFn?.()).catch(console.error);
      };
    }
    
  }, [settings, isWorkflowRoute, hasValidWorkflowParams, initializeWebSocket]);

  // Fallback effect to handle edge cases where steps become available after navigation
  useEffect(() => {
    console.log(`[WebSocketStepsContext] Fallback effect triggered - isWorkflowRoute: ${isWorkflowRoute}, hasValidWorkflowParams: ${hasValidWorkflowParams}, isInitialized: ${isInitialized}, wsInitialized: ${isWebSocketInitialized.current}, isInitializing: ${isInitializingRef.current}`);
    
    // This effect only handles very specific edge cases:
    // 1. We're on a workflow route with valid params
    // 2. Steps just became initialized (isInitialized=true)  
    // 3. But WebSocket is somehow not initialized yet
    // 4. And we're not already initializing
    if (isWorkflowRoute && hasValidWorkflowParams && isInitialized && !isWebSocketInitialized.current && !isInitializingRef.current) {
      console.log('[WebSocketStepsContext] FALLBACK EFFECT: Steps just became available but WebSocket not initialized, initializing...');
      
      // Small delay to ensure all context updates are complete and avoid race conditions
      initializationTimeoutRef.current = window.setTimeout(() => {
         if (connectionManagerRef.current?.hasValidSettings(settings) && !isWebSocketInitialized.current && !isInitializingRef.current) {
           console.log('[WebSocketStepsContext] FALLBACK EFFECT: Executing delayed initialization');
           isInitializingRef.current = true;
           
           initializeWebSocket().then(cleanupFn => {
             isInitializingRef.current = false;
             return cleanupFn;
           }).catch(error => {
             isInitializingRef.current = false;
             console.error('[WebSocketStepsContext] Fallback effect initialization failed:', error);
           });
         } else {
           console.log('[WebSocketStepsContext] FALLBACK EFFECT: Delayed initialization skipped - conditions no longer met');
         }
       }, 100);
    }
    
    return () => {
       if (initializationTimeoutRef.current) {
         window.clearTimeout(initializationTimeoutRef.current);
         initializationTimeoutRef.current = null;
       }
     };
  }, [isWorkflowRoute, hasValidWorkflowParams, isInitialized, settings, initializeWebSocket]);
  
  // Pre-populate agents cache and process pending messages
  useEffect(() => {
    if (moduleSlug && steps.length > 0) {
      agentManagerRef.current?.getAgentsForCurrentModule().then(agents => {
        console.log(`[WebSocketStepsContext] Populated agents cache with ${agents.length} agents`);
        
        // Process any pending messages that were queued when steps weren't available
        return messageManagerRef.current?.processPendingMessages(steps);
      }).then(() => {
        console.log(`[WebSocketStepsContext] Processed pending messages`);
        // Update chat messages state after processing pending messages
        setChatMessages(messageManagerRef.current?.getChatMessages() || new Map());
      }).catch(error => {
        console.warn('[WebSocketStepsContext] Failed to populate agents cache or process pending messages:', error);
      });
    }
  }, [moduleSlug, steps.length]);
  
  // Send message function
  const sendMessage = useCallback(async (text: string, data?: any, targetStepIndex?: number) => {
    const stepIndex = targetStepIndex !== undefined ? targetStepIndex : activeStep ?? 0;
    
    console.log(`[WebSocketStepsContext] sendMessage called with stepIndex: ${stepIndex}`);
    
    if (hasSteps) {
      const step = steps[stepIndex];
      if (!step?.botId) {
        console.warn(`[WebSocketStepsContext] No bot configured for step ${stepIndex}`);
        return;
      }
      
      const agent = await agentManagerRef.current!.getAgentForStep(stepIndex, steps);
      if (!agent) {
        console.warn(`[WebSocketStepsContext] Agent not found for step ${stepIndex}`);
        return;
      }
      
      // Add user message to local chat history
      if (!data && text) {
        const userMessage = messageManagerRef.current!.createUserMessage(
          text, 
          stepIndex, 
          messageManagerRef.current!.getThreadId(stepIndex)
        );
        await addChatMessage(userMessage);
      }
      
      const hub = connectionManagerRef.current!.getHub();
      if (hub) {
        if (data) {
          await hub.sendData(agent.workflowType!, data);
        } else {
          await hub.sendChat(agent.workflowType!, text);
        }
      }
    }
  }, [hasSteps, steps, activeStep, addChatMessage]);
  
  // Subscription methods
  const subscribeToData = useCallback((subscriberId: string, messageTypes: string[], callback: (message: any) => void) => {
    const hub = connectionManagerRef.current?.getHub();
    if (!hub) return () => {};
    return hub.subscribeToData(subscriberId, messageTypes, callback);
  }, []);
  
  const unsubscribeFromData = useCallback((subscriberId: string) => {
    connectionManagerRef.current?.getHub()?.unsubscribeFromData(subscriberId);
  }, []);
  
  const subscribeToChatMessages = useCallback((callback: (chat: any) => void) => {
    const hub = connectionManagerRef.current?.getHub();
    if (!hub) return () => {};
    return hub.subscribeToChatMessages(callback);
  }, []);
  
  const subscribeToHandoffs = useCallback((callback: (handoff: any) => void) => {
    const hub = connectionManagerRef.current?.getHub();
    if (!hub) return () => {};
    return hub.subscribeToHandoffs(callback);
  }, []);
  
  // Get statistics
  const getStats = useCallback(() => {
    const hub = connectionManagerRef.current?.getHub();
    const messageStoreStats = messageManagerRef.current?.getMessageStoreStats() || {};
    
    return {
      hub: hub?.getStats() || null,
      messageStore: messageStoreStats,
      context: {
        isConnected,
        connectionStatesCount: connectionStates.size
      }
    };
  }, [isConnected, connectionStates]);
  
  const value: WebSocketStepsContextType = {
    connectionStates,
    isConnected,
    chatMessages,
    getChatMessagesForStep,
    handoffTypingStates,
    activityLogStates,
    connect: async () => {},
    disconnect: async () => {},
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