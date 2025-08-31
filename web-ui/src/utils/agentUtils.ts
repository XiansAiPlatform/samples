import { useContext } from 'react';
import type { Agent, Bot } from '../types';

// Global agent context for non-React service access
export interface AgentContextType {
  currentAgent: Agent | null;
  currentBot: Bot | null;
  setCurrentAgent: (agent: Agent | null) => void;
  setCurrentBot: (bot: Bot | null) => void;
  agents: Agent[];
  getCurrentFlow: () => string | null;
  getCurrentWorkflow: () => string | null;
}

// This will be set by AgentContext.tsx to avoid circular imports
let AgentContext: React.Context<AgentContextType | undefined>;

export const setAgentContext = (context: React.Context<AgentContextType | undefined>) => {
  AgentContext = context;
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

let globalAgentContext: AgentContextType | null = null;

export const setGlobalAgentContext = (context: AgentContextType) => {
  globalAgentContext = context;
};

export const getCurrentAgentGlobal = (): Agent | null => {
  return globalAgentContext?.currentAgent || null;
};

export const getCurrentBotGlobal = (): Bot | null => {
  return globalAgentContext?.currentBot || null;
};

export const getCurrentFlowGlobal = (): string | null => {
  return globalAgentContext?.getCurrentFlow() || null;
};

export const getCurrentWorkflowGlobal = (): string | null => {
  return globalAgentContext?.getCurrentWorkflow() || null;
};