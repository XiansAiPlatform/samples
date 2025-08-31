import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ChatPanel from '../components/chat/ChatPanel';

import type { Agent, Bot } from '../types';

interface BotPageProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
}

const BotPage: React.FC<BotPageProps> = ({ agents }) => {
  const { agentSlug, botSlug, documentId } = useParams<{ 
    agentSlug: string; 
    botSlug?: string; 
    documentId?: string;
  }>();
  
  // Find the agent by slug
  const currentAgent = agents.find(agent => agent.slug === agentSlug);
  
  // Find the bot within the agent
  let currentBot: Bot | null = null;
  if (currentAgent) {
    if (botSlug) {
      currentBot = currentAgent.bots.find(bot => bot.slug === botSlug) || null;
    } else if (currentAgent.bots.length > 0) {
      // Use first bot as default when accessing agent-level route
      currentBot = currentAgent.bots[0];
    }
  }
  
  console.log(`[BotPage] 🔄 Render - agentSlug: ${agentSlug}, botSlug: ${botSlug}, agent: ${currentAgent?.name}, bot: ${currentBot?.name}, documentId: ${documentId}`);
  
  // If agent not found, redirect to home
  if (!currentAgent) {
    return <Navigate to="/" replace />;
  }
  
  // If agent found but no valid bot, redirect to agent default route
  if (!currentBot) {
    return <Navigate to={`/${currentAgent.slug}`} replace />;
  }
  
  // Direct access to route params, no providers needed
  return (
    <BotPageContent 
      currentAgent={currentAgent} 
      currentBot={currentBot}
      documentId={documentId} 
      agents={agents} 
    />
  );
};

// Separate component that has access to route context  
const BotPageContent: React.FC<{ 
  currentAgent: Agent; 
  currentBot: Bot; 
  documentId?: string; 
  agents: Agent[] 
}> = React.memo(({ currentAgent, currentBot, documentId, agents }) => {
  console.log(`[BotPageContent] 🔄 Render - agent: ${currentAgent?.name} bot: ${currentBot?.name} docId: ${documentId}`);
  console.log(`[BotPageContent] 🧪 React.memo wrapped component rendering`);
  
  // Create chat panel with memoization to persist across document navigation
  // Recreates when bot ID changes (ChatPanel will get documentId directly from URL)
  // Note: ChatPanel will use the configured participant ID from SDK config
  // This enables proper conversation history management when switching between routes
  const chatPanel = useMemo(() => {
    console.log(`[BotPageContent] 🔧 Creating new ChatPanel for bot: ${currentBot?.name} id: ${currentBot?.id}`);
    return (
      <ChatPanel 
        currentAgent={currentBot}
      />
    );
  }, [currentBot]); // Depend only on bot object, ChatPanel will handle documentId changes via useParams

  // Show bot component only if:
  // 1. Bot has a main component AND
  // 2. There's a documentId in the URL (meaning we're in document mode)
  const shouldShowBotComponent = currentBot.mainComponent && documentId;
  
  let botComponent: React.ReactNode = undefined;
  if (shouldShowBotComponent && currentBot.mainComponent) {
    const MainComponent = currentBot.mainComponent;
    // Pass agents as Bot[] for backwards compatibility with existing components
    const botsList = agents.flatMap(agent => agent.bots);
    botComponent = <MainComponent agents={botsList} currentBot={currentBot} />;
  }

  return (
    <MainLayout
      chatPanel={chatPanel}
      agentComponent={botComponent}
    />
  );
}, (prevProps, nextProps) => {
  // Re-render if agent/bot changes OR if agents array changes
  // DocumentId changes are now handled directly by ChatPanel via useParams
  const agentChanged = prevProps.currentAgent !== nextProps.currentAgent;
  const botChanged = prevProps.currentBot !== nextProps.currentBot;
  const documentChanged = prevProps.documentId !== nextProps.documentId;
  const agentsChanged = prevProps.agents !== nextProps.agents;
  const shouldSkipRender = !agentChanged && !botChanged && !documentChanged && !agentsChanged;
  console.log(`[BotPageContent] 🔍 React.memo comparison - prev agent: ${prevProps.currentAgent?.id} next agent: ${nextProps.currentAgent?.id} prev bot: ${prevProps.currentBot?.id} next bot: ${nextProps.currentBot?.id} prev doc: ${prevProps.documentId} next doc: ${nextProps.documentId} shouldSkip: ${shouldSkipRender}`);
  console.log(`[BotPageContent] 🔍 React.memo comparison function called!`);
  return shouldSkipRender;
});

export default BotPage;