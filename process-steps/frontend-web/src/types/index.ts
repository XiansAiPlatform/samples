// Bot/Agent configuration from steps
export interface BotAgent {
  id?: string;
  title: string;
  agent?: string;
  description?: string;
  workflowType?: string;
  workflowId?: string;
}

// Message types
export interface ChatMessage {
  id: string;
  text: string;
  direction: 'Incoming' | 'Outgoing';
  messageType: 'Chat' | 'Data' | 'Handoff';
  stepIndex: number;
  threadId?: string;
  timestamp: Date;
  data?: any;
  isHistorical?: boolean;
  activityLog?: ActivityData[]; // Activities performed before this message
}

// ActivityLog data for typing indicators
export interface ActivityData {
  summary?: string;
  details?: string;
  success?: boolean;
  timestamp?: string;
  id?: string;
}

export type Message = ChatMessage;

// Connection state
export interface ConnectionState {
  stepIndex: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError?: string;
  lastActivity?: Date;
}

// WebSocket message formats for the backend
export interface InboundMessage {
  threadId?: string;
  agent: string;
  workflowType: string;
  workflowId: string;
  participantId: string;
  text: string;
  data?: any;
}

export interface OutboundMessage {
  workflowId?: string;
  text: string;
  direction?: string;
  type?: 'chat' | 'system';
  payload?: any;
}

// Hub events
export type HubEventType = 'message' | 'connection_change' | 'error' | 'thread_history';

export interface HubEvent {
  type: HubEventType;
  stepIndex: number;
  data: any;
}

// Configuration
export interface AppConfig {
  websocketUrl: string;
  secretKey: string;
  tenantId: string;
  participantId: string;
  metadata?: any;
}

// Entity Management Types
export interface BaseEntity {
  id: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  metadata?: Record<string, any>;
}

export interface EntityState<T extends BaseEntity = BaseEntity> {
  entities: Map<string, T>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface EntityAction<T extends BaseEntity = BaseEntity> {
  type: 'ADD' | 'UPDATE' | 'DELETE' | 'CLEAR' | 'SET_LOADING' | 'SET_ERROR';
  payload?: {
    entity?: T;
    entities?: T[];
    entityId?: string;
    error?: string;
    loading?: boolean;
  };
  timestamp: Date;
}

export interface EntitySubscription {
  id: string;
  entityTypes?: string[];
  entityIds?: string[];
  callback: (entities: BaseEntity[], action: EntityAction) => void;
}

export interface EntityQueryOptions {
  type?: string;
  ids?: string[];
  filter?: (entity: BaseEntity) => boolean;
  sortBy?: keyof BaseEntity | ((entity: BaseEntity) => any);
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface EntityStoreState {
  entities: Map<string, BaseEntity>;
  entityTypes: Map<string, EntityState>;
  subscriptions: Map<string, EntitySubscription>;
  loading: boolean;
  error: string | null;
} 