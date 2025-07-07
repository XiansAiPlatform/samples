import { useEffect, useState, useCallback } from 'react';
import { useWebSocketSteps } from '../context/WebSocketStepsContext';
import { type ChatMessageData } from '@99xio/xians-sdk-typescript';

export interface ChatMessageSubscriptionOptions {
  onChatMessage?: (chat: ChatMessageData) => void;
  enabled?: boolean;
  filterByWorkflowId?: string;
  filterByDirection?: 'Incoming' | 'Outgoing';
}

/**
 * Custom hook for subscribing specifically to chat messages
 * This provides clean separation from handoff and data messages
 */
export function useChatMessageSubscription(options: ChatMessageSubscriptionOptions = {}) {
  const { subscribeToChatMessages } = useWebSocketSteps();
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [latestChatMessage, setLatestChatMessage] = useState<ChatMessageData | null>(null);

  const handleChatMessage = useCallback((chat: ChatMessageData) => {
    // Apply filters if specified
    if (options.filterByWorkflowId && chat.workflowId !== options.filterByWorkflowId) {
      return;
    }
    
    if (options.filterByDirection && chat.direction !== options.filterByDirection) {
      return;
    }

    setChatMessages(prev => [...prev, chat]);
    setLatestChatMessage(chat);
    
    // Call external callback if provided
    options.onChatMessage?.(chat);
  }, [options.onChatMessage, options.filterByWorkflowId, options.filterByDirection]);

  useEffect(() => {
    if (options.enabled === false) return;
    
    console.log('[useChatMessageSubscription] Subscribing to chat messages');
    
    const unsubscribe = subscribeToChatMessages(handleChatMessage);

    return () => {
      console.log('[useChatMessageSubscription] Unsubscribing from chat messages');
      unsubscribe();
    };
  }, [subscribeToChatMessages, handleChatMessage, options.enabled]);

  const clearChatMessages = useCallback(() => {
    setChatMessages([]);
    setLatestChatMessage(null);
  }, []);

  const getChatMessagesByWorkflow = useCallback((workflowId: string) => {
    return chatMessages.filter(msg => msg.workflowId === workflowId);
  }, [chatMessages]);

  const getLatestChatMessageByWorkflow = useCallback((workflowId: string) => {
    const workflowMessages = getChatMessagesByWorkflow(workflowId);
    return workflowMessages.length > 0 ? workflowMessages[workflowMessages.length - 1] : null;
  }, [getChatMessagesByWorkflow]);

  return {
    chatMessages,
    latestChatMessage,
    clearChatMessages,
    getChatMessagesByWorkflow,
    getLatestChatMessageByWorkflow,
    chatMessageCount: chatMessages.length
  };
}

/**
 * Hook specifically for monitoring outgoing chat messages (agent responses)
 */
export function useAgentResponseMonitor(workflowId?: string) {
  return useChatMessageSubscription({
    filterByDirection: 'Outgoing',
    filterByWorkflowId: workflowId,
    onChatMessage: (chat) => {
      console.log('[AgentResponseMonitor] Agent response received:', {
        workflowId: chat.workflowId,
        text: chat.text.substring(0, 100) + (chat.text.length > 100 ? '...' : ''),
        timestamp: chat.timestamp,
        isHistorical: chat.isHistorical
      });
    }
  });
}

/**
 * Hook specifically for monitoring incoming chat messages (user messages)
 */
export function useUserMessageMonitor(workflowId?: string) {
  return useChatMessageSubscription({
    filterByDirection: 'Incoming',
    filterByWorkflowId: workflowId,
    onChatMessage: (chat) => {
      console.log('[UserMessageMonitor] User message received:', {
        workflowId: chat.workflowId,
        text: chat.text,
        timestamp: chat.timestamp,
        isHistorical: chat.isHistorical
      });
    }
  });
} 