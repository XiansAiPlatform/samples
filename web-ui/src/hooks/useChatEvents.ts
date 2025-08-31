import { useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { useDataMessage } from './useDataMessage';
import type { DataMessagePayload } from '../context/dataMessageTypes';
import { createWorkLogMessage, createUIComponentMessage } from '../utils/messageHelpers';

interface UseChatEventsProps {
  isConnected: boolean;
  addMessage: (message: ChatMessageType) => void;
  handleSendMessage: (message: string) => Promise<void>;
  queueMessage: (message: string) => void;
  onShouldFocusInput: () => void;
}

/**
 * Custom hook for managing chat event subscriptions (WorkLog, UICommand, SendChat)
 */
export const useChatEvents = ({
  isConnected,
  addMessage,
  handleSendMessage,
  queueMessage,
  onShouldFocusInput,
}: UseChatEventsProps) => {
  const dataMessageContext = useDataMessage();

  // Subscribe to WorkLog data messages
  useEffect(() => {
    const handleWorkLogMessage = (payload: DataMessagePayload) => {
      console.log('[useChatEvents] Received WorkLog message:', payload);
      
      // Convert WorkLog data message to chat message for display
      const workLogChatMessage = createWorkLogMessage(payload);
      addMessage(workLogChatMessage);
    };

    // Subscribe to WorkLog messages
    const unsubscribe = dataMessageContext.subscribe('WorkLog', handleWorkLogMessage);
    return unsubscribe;
  }, [dataMessageContext, addMessage]);

  // Subscribe to UIComponent data messages
  useEffect(() => {
    const handleUICommandMessage = (payload: DataMessagePayload) => {
      console.log('[useChatEvents] Received UICommand message:', payload);
      
      // Convert UIComponent data message to chat message for display
      const uiCommandChatMessage = createUIComponentMessage(payload);
      addMessage(uiCommandChatMessage);
      
      // Restore focus to chat input after UI component is rendered
      onShouldFocusInput();
    };

    // Subscribe to UICommand messages
    const unsubscribe = dataMessageContext.subscribe('UICommand', handleUICommandMessage);
    return unsubscribe;
  }, [dataMessageContext, addMessage, onShouldFocusInput]);

  // Listen for SendChat events from UI components
  useEffect(() => {
    const handleSendChat = async (event: CustomEvent) => {
      console.log('[useChatEvents] Received SendChat event:', event.detail);
      
      const { message } = event.detail as { message: string };
      if (message && typeof message === 'string') {
        if (isConnected) {
          try {
            await handleSendMessage(message);
          } catch (err) {
            console.error('Send message error:', err);
          }
        } else {
          queueMessage(message);
        }
      }
    };

    // Listen for SendChat events
    const eventHandler = (event: Event) => {
      handleSendChat(event as CustomEvent);
      // Restore focus to chat input after UI component is rendered
      onShouldFocusInput();
    };
    
    window.addEventListener('SendChat', eventHandler);

    return () => {
      window.removeEventListener('SendChat', eventHandler);
    };
  }, [isConnected, handleSendMessage, queueMessage, onShouldFocusInput]);
};