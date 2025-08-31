// Core types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
}
export interface Agent {
  enabled: boolean;
  id: string;
  name: string;
  slug: string; // URL-friendly identifier (e.g., 'legal', 'sales', 'finance')
  bots: Bot[];
  flow?: string;
  description?: string;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  slug: string; // URL-friendly identifier within the agent (e.g., 'assistant', 'analyzer')
  workflow: string;
  capabilities: string[];
  avatar?: string;
  mainComponent?: React.ComponentType<Record<string, unknown>>;
}

export interface ContractEntity {
  id: string;
  type: ContractEntityType;
  title: string;
  status: string;
  data: ContractEntityData;
  lastModified: Date;
  assignedTo?: string;
}

export interface ContractEntityData {
  // Contract-specific data
  contract?: Contract;
  validations?: ContractValidation[];
  
  // Legacy order data (for backwards compatibility)
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  orderDetails?: {
    orderDate: string;
    dueDate: string;
    currency: string;
    total: number;
    taxAmount: number;
    subtotal: number;
  };
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
}

// Backend model interfaces matching C# classes exactly
export interface Contract {
  id: string; // Guid from backend
  title: string;
  createdDate: string; // DateTime from backend
  effectiveDate?: string | null; // DateTime? from backend
  description: string;
  parties: Party[];
  terms: Term[];
}

export interface Party {
  id: string; // Guid from backend
  role: string;
  name: string;
  representatives: Person[];
  signatories: Person[];
}

export interface Person {
  id: string; // Guid from backend
  name: string;
  nationalId: string;
  title: string;
  email: string;
  phone: string;
}

export interface Term {
  id: string; // Guid from backend
  category: TermCategory;
  text: string;
}

export type TermCategory = 
  | 'General'
  | 'Payment' 
  | 'Delivery'
  | 'Warranty'
  | 'Liability'
  | 'Termination'
  | 'Confidentiality'
  | 'Intellectual_Property'
  | 'Dispute_Resolution'
  | 'Compliance';

export interface ContractValidation {
  severity: number; // 0 = error, 1 = warning, 2 = info
  message: string;
  fieldPath: string;
  suggestedAction?: string;
  priorityIndex: number;
  command?: string | null;
  prompt?: string; // Optional prompt to send to chat agent
}

export type ContractEntityType = 
  | 'order'
  | 'customer'
  | 'invoice'
  | 'product'
  | 'contract';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type: 'text' | 'file' | 'action';
  metadata?: Record<string, unknown>;
}

export interface Chat {
  id: string;
  agentId: string;
  userId: string;
  contractEntityId?: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentRecommendation {
  id: string;
  type: 'validation' | 'suggestion' | 'warning' | 'info';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityField?: string;
  suggestedAction?: string;
  createdAt: Date;
}

export interface AppState {
  user: User | null;
  currentAgent: Bot | null;
  currentContractEntity: ContractEntity | null;
  activeChat: Chat | null;
  recommendations: AgentRecommendation[];
  isLoading: boolean;
  error: string | null;
} 