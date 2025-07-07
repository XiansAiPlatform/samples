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
  
  // Update refs
  useEffect(() => {
    activeStepRef.current = activeStep;
    // Update module slug if changed
    if (agentManagerRef.current) {
      agentManagerRef.current.updateModuleSlug(moduleSlug);
    }
  }, [activeStep, moduleSlug]);
  
  // Main WebSocket initialization effect
  useEffect(() => {
    // For workflow routes, wait for steps to be loaded
    if (isWorkflowRoute && !isInitialized) {
      console.log('[WebSocketStepsContext] Workflow route detected but steps not yet loaded, waiting...');
      return;
    }
    
    // Check if we have valid settings
    if (!connectionManagerRef.current?.hasValidSettings(settings)) {
      console.log('[WebSocketStepsContext] Not initializing - settings not ready');
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
    }
    
    console.log('[WebSocketStepsContext] Initializing WebSocket connections...');
    
    const initializeWebSocket = async () => {
      try {
        // Initialize SDK
        const hub = await connectionManagerRef.current!.initializeSDK(settings);
        
        // Set up event handlers
        const handleConnectionChange = async (ev: { workflowId: string; data: ConnectionState }) => {
          await connectionManagerRef.current!.handleConnectionChange(ev, steps, hasSteps);
          setConnectionStates(connectionManagerRef.current!.getConnectionStates());
          setIsConnected(connectionManagerRef.current!.getIsConnected());
        };
        
        const handleMessage = async (ev: { workflowId: string; data: any }) => {
          const stepIndex = await agentManagerRef.current!.workflowIdToStepIndex(ev.workflowId, steps, activeStepRef.current);
          const chatMessage: ChatMessage = {
            ...ev.data,
            stepIndex
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
          
          await addChatMessage(chatMessage);
        };
        
        const handleHandoff = async (handoff: any) => {
          await handoffManagerRef.current!.handleHandoff(handoff, activeStepRef.current, steps, setActiveStep);
        };
        
        const handleError = (event: any) => {
          console.error(`[WebSocketStepsContext] WebSocket error:`, event.data);
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
          (message: any) => {
            activityLogManagerRef.current!.handleActivityLogMessage(message, activeStepRef.current, addActivityLog);
          }
        );
        
        console.log('[WebSocketStepsContext] Event listeners and subscriptions attached');
        isWebSocketInitialized.current = true;
        
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
      }
    };
    
    const cleanup = initializeWebSocket();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.()).catch(console.error);
    };
    
  }, [steps, isInitialized, settings, isWorkflowRoute, hasSteps, addChatMessage, addActivityLog, setActiveStep]);
  
  // Pre-populate agents cache
  useEffect(() => {
    if (moduleSlug && steps.length > 0) {
      agentManagerRef.current?.getAgentsForCurrentModule().then(agents => {
        console.log(`[WebSocketStepsContext] Populated agents cache with ${agents.length} agents`);
      }).catch(error => {
        console.warn('[WebSocketStepsContext] Failed to populate agents cache:', error);
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