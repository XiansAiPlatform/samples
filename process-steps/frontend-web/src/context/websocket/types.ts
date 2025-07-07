import { ChatMessage, ConnectionState, ActivityData } from '../../types';

export interface WebSocketStepsContextType {
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

export interface WebSocketProviderProps {
  children: React.ReactNode;
}

export interface Agent {
  id: string;
  workflowType: string;
  workflowId?: string;
}

export interface Step {
  slug: string;
  title: string;
  botId: string;
}

export interface Settings {
  agentWebsocketUrl: string;
  Authorization?: string;
  agentApiKey?: string;
  tenantId: string;
  participantId: string;
  defaultMetadata?: any;
}

export interface HandoffMessage {
  workflowId?: string;
  text: string;
  direction: string;
  messageType: string;
  timestamp: Date;
  threadId?: string;
  data?: any;
  isHistorical?: boolean;
}

export interface StepsContextData {
  steps: Step[];
  activeStep: number | null;
  isInitialized: boolean;
  setActiveStep: (stepIndex: number) => void;
} 