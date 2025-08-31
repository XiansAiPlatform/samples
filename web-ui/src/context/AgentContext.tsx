import React, { createContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Agent, Bot } from '../types';
import { setGlobalAgentContext, setAgentContext, getCurrentAgentGlobal, getCurrentBotGlobal, type AgentContextType } from '../utils/agentUtils';

const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Register the context with utils for useAgent hook
setAgentContext(AgentContext);

interface AgentProviderProps {
  children: ReactNode;
  agents: Agent[];
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children, agents }) => {
  const location = useLocation();

  // Parse current agent and bot from URL path
  const parseAgentAndBotFromPath = useCallback((pathname: string): { agent: Agent | null; bot: Bot | null } => {
    const currentPath = pathname.slice(1); // Remove leading slash
    const segments = currentPath.split('/').filter(Boolean);
    
    const agentSlug = segments[0];
    const botSlug = segments[1];
    
    const agent = agentSlug ? agents.find(a => a.slug === agentSlug) || null : null;
    
    // If we have an agent but no specific bot slug, use the first bot as default
    let bot: Bot | null = null;
    if (agent) {
      if (botSlug) {
        bot = agent.bots.find(b => b.slug === botSlug) || null;
      } else if (agent.bots.length > 0) {
        // Use first bot as default when accessing agent-level route
        bot = agent.bots[0];
      }
    }
    
    return { agent, bot };
  }, [agents]);

  // Initialize with current URL immediately (synchronous)
  const [currentAgent, setCurrentAgentState] = useState<Agent | null>(() => {
    const { agent } = parseAgentAndBotFromPath(location.pathname);
    console.log(`[AgentContext] 🚀 Initial agent set: ${agent?.name} for path: ${location.pathname}`);
    return agent;
  });

  const [currentBot, setCurrentBotState] = useState<Bot | null>(() => {
    const { bot } = parseAgentAndBotFromPath(location.pathname);
    console.log(`[AgentContext] 🚀 Initial bot set: ${bot?.name} for path: ${location.pathname}`);
    return bot;
  });

  const setCurrentAgent = useCallback((agent: Agent | null) => {
    setCurrentAgentState(agent);
  }, []);

  const setCurrentBot = useCallback((bot: Bot | null) => {
    setCurrentBotState(bot);
  }, []);

  // Update current agent and bot based on URL changes
  useEffect(() => {
    const { agent, bot } = parseAgentAndBotFromPath(location.pathname);
    
    // Update agent if different
    if (agent !== currentAgent) {
      console.log(`[AgentContext] 🎯 Current agent updated: ${agent?.name} for path: ${location.pathname}`);
      setCurrentAgentState(agent);
    }
    
    // Update bot if different
    if (bot !== currentBot) {
      console.log(`[AgentContext] 🤖 Current bot updated: ${bot?.name} for path: ${location.pathname}`);
      setCurrentBotState(bot);
    }
  }, [location.pathname, parseAgentAndBotFromPath, currentAgent, currentBot]);

  const getCurrentFlow = useCallback((): string | null => {
    return currentAgent?.flow || null;
  }, [currentAgent]);

  const getCurrentWorkflow = useCallback((): string | null => {
    return currentBot?.workflow || null;
  }, [currentBot]);

  const value: AgentContextType = useMemo(() => ({
    currentAgent,
    currentBot,
    setCurrentAgent,
    setCurrentBot,
    agents,
    getCurrentFlow,
    getCurrentWorkflow,
  }), [currentAgent, currentBot, setCurrentAgent, setCurrentBot, agents, getCurrentFlow, getCurrentWorkflow]);

  // Expose context to global functions for service access
  // Set it immediately (synchronously) when value changes
  useEffect(() => {
    setGlobalAgentContext(value);
    console.log(`[AgentContext] 🌐 Global context updated: ${value.currentAgent?.name}, ${value.currentBot?.name}`);
  }, [value]);

  // Also set global context immediately during render if we have an agent or bot
  // This ensures global context is available synchronously
  if ((currentAgent && getCurrentAgentGlobal() !== currentAgent) || 
      (currentBot && getCurrentBotGlobal() !== currentBot)) {
    setGlobalAgentContext(value);
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};