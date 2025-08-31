import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage as ChatMessageType, Bot } from '../types';
import { isDuplicateMessage, createUserMessage } from '../utils/messageHelpers';

interface UseChatMessagesProps {
  isConnected: boolean;
  sendMessage: (message: string) => Promise<void>;
  getCurrentAgent: () => Bot | null;
  onError: (error: string) => void;
}

interface UseChatMessagesReturn {
  messages: ChatMessageType[];
  pendingMessages: string[];
  isLoadingHistory: boolean;
  addMessage: (message: ChatMessageType) => void;
  clearMessages: () => void;
  setIsLoadingHistory: (loading: boolean) => void;
  handleSendMessage: (messageText: string) => Promise<void>;
  queueMessage: (message: string) => void;
}

/**
 * Custom hook for managing chat messages state and operations
 */
export const useChatMessages = ({
  isConnected,
  sendMessage,
  getCurrentAgent,
  onError,
}: UseChatMessagesProps): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const loadingHistoryTimeoutRef = useRef<number | null>(null);

  // Helper function to clear loading history with timeout management
  const clearLoadingHistory = (delay: number = 0) => {
    if (loadingHistoryTimeoutRef.current) {
      clearTimeout(loadingHistoryTimeoutRef.current);
    }
    
    if (delay > 0) {
      loadingHistoryTimeoutRef.current = setTimeout(() => {
        console.log('[useChatMessages] Clearing loading history indicator');
        setIsLoadingHistory(false);
        loadingHistoryTimeoutRef.current = null;
      }, delay);
    } else {
      setIsLoadingHistory(false);
      loadingHistoryTimeoutRef.current = null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingHistoryTimeoutRef.current) {
        clearTimeout(loadingHistoryTimeoutRef.current);
      }
    };
  }, []);

  const addMessage = (message: ChatMessageType) => {
    setMessages(prev => {
      // Check if this is the first history message (indicates history loading start)
      if (prev.length === 0 && message.metadata?.socketMessage) {
        setIsLoadingHistory(true);
        clearLoadingHistory(1500);
      }
      
      // If we're loading history and receive any message, turn off loading after a short delay
      if (message.metadata?.isHistoryMessage || message.sender === 'agent') {
        clearLoadingHistory(500);
      }

      // Prevent duplicate history messages
      if (isDuplicateMessage(message, prev)) {
        const messageSocketData = message.metadata?.socketMessage as { id?: string } | undefined;
        const messageId = messageSocketData?.id || message.id;
        console.log(`[useChatMessages] Skipping duplicate history message: ${messageId || 'no-id'}`);
        return prev;
      }

      console.log(`[useChatMessages] Adding message - Sender: ${message.sender}, Content: "${message.content.substring(0, 50)}...", ID: ${message.id}`);
      return [...prev, message];
    });
  };

  const clearMessages = useCallback(() => {
    console.log('[useChatMessages] Clearing all messages');
    setMessages([]);
    setPendingMessages([]);
  }, []);

  const setIsLoadingHistoryCallback = useCallback((loading: boolean) => {
    setIsLoadingHistory(loading);
  }, []);

  const handleSendMessage = async (messageText: string): Promise<void> => {
    if (!messageText.trim() || !isConnected || !getCurrentAgent()) {
      return;
    }

    try {
      // Send to agent first - only add to UI if successful
      await sendMessage(messageText);
      
      // Only add user message to UI after successful backend call
      const userMessage = createUserMessage(messageText);
      setMessages(prev => [...prev, userMessage]);
      
    } catch (err) {
      onError('Failed to send message');
      console.error('Send message error:', err);
      throw err;
    }
  };

  const queueMessage = (message: string) => {
    console.log('[useChatMessages] Queueing message for later delivery');
    setPendingMessages(prev => [...prev, message]);
  };

  // Process pending messages when connection is established and agent is ready
  useEffect(() => {
    console.log('[useChatMessages] Pending message check - isConnected:', isConnected, 'hasAgent:', !!getCurrentAgent(), 'pendingCount:', pendingMessages.length);
    
    if (isConnected && getCurrentAgent() && pendingMessages.length > 0) {
      console.log('[useChatMessages] Processing', pendingMessages.length, 'pending messages');
      
      const messagesToProcess = [...pendingMessages];
      setPendingMessages([]); // Clear the queue immediately to prevent re-processing
      
      // Process messages sequentially to maintain order and better error handling
      const processNextMessage = async (messageIndex: number) => {
        if (messageIndex >= messagesToProcess.length) {
          return;
        }

        const message = messagesToProcess[messageIndex];
        
        // Double-check connection and agent state before each message
        if (!isConnected || !getCurrentAgent()) {
          console.warn('[useChatMessages] Connection or agent lost while processing pending messages');
          onError('Connection lost while processing pending messages');
          // Re-queue remaining messages
          setPendingMessages(messagesToProcess.slice(messageIndex));
          return;
        }

        try {
          console.log('[useChatMessages] Sending queued message:', message.substring(0, 50) + '...');
          
          // Send to agent first - only add to UI if successful
          await sendMessage(message);
          
          // Only add user message to UI after successful backend call
          const userMessage = createUserMessage(message, `user-queued-${Date.now()}-${messageIndex}`);
          setMessages(prev => [...prev, userMessage]);
          console.log('[useChatMessages] Successfully added user message to UI:', message.substring(0, 50) + '...');
          
          // Small delay before processing next message to avoid overwhelming the service
          if (messageIndex < messagesToProcess.length - 1) {
            setTimeout(() => processNextMessage(messageIndex + 1), 300);
          }
          
        } catch (err) {
          console.error('[useChatMessages] Failed to send queued message:', err);
          onError(`Failed to send message: "${message.substring(0, 30)}..."`);
          
          // Re-queue remaining messages (including the failed one) for retry
          setPendingMessages(messagesToProcess.slice(messageIndex));
        }
      };

      // Start processing from the first message
      processNextMessage(0);
    }
  }, [isConnected, pendingMessages.length, getCurrentAgent()]);

  return {
    messages,
    pendingMessages,
    isLoadingHistory,
    addMessage,
    clearMessages,
    setIsLoadingHistory: setIsLoadingHistoryCallback,
    handleSendMessage,
    queueMessage,
  };
};