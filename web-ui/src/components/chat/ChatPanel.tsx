import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import type { Bot } from '../../types';

import AgentHeader from './AgentHeader';
import MessageInput, { type MessageInputRef } from './MessageInput';
import LoadingIndicators from './LoadingIndicators';
import ErrorAlert from './ErrorAlert';
import TypingIndicator from './TypingIndicator';
import MessageList from './MessageList';

import { useChatService } from '../../hooks/useChatService';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatEvents } from '../../hooks/useChatEvents';
import { useChatAgentState } from '../../hooks/useChatAgentState';
import { useDataMessage } from '../../hooks/useDataMessage';

interface ChatPanelProps {
  currentAgent?: Bot | null;
  participantId?: string; // Optional - will use SDK config participant ID if not provided
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  currentAgent,
  participantId,
}) => {
  // Get documentId directly from URL params like ContractEntityPanel does
  const { documentId } = useParams<{ documentId?: string }>();
  const [messageInput, setMessageInput] = useState('');
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messageInputRef = useRef<MessageInputRef>(null);

  // Track component lifecycle
  useEffect(() => {
    console.log('[ChatPanel] 🚀 Component mounted');
    return () => {
      console.log('[ChatPanel] 💀 Component unmounting');
    };
  }, []);

  // Get DataMessage context for publishing data messages
  const dataMessageContext = useDataMessage();

  // Error handler
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // Initialize chat service
  const {
    isConnected,
    isLoading: serviceLoading,
    setCurrentAgent,
    sendMessage,
    getCurrentAgent,
  } = useChatService({
    participantId,
    onMessageReceived: (message) => addMessage(message),
    onConnectionStateChanged: (connected) => {
      if (connected) {
        setError(null);
      }
    },
    onError: handleError,
    onDataMessageReceived: (message) => {
      console.log('[ChatPanel] Data message received:', message);
      // Publish data message to DataMessageContext so WorkLog and UICommand handlers can process it
      dataMessageContext.publish(message);
    },
    onChatRequestSent: (requestId) => addPendingRequest(requestId),
    onChatResponseReceived: (requestId) => removePendingRequest(requestId),
  });

  // Message state management
  const {
    messages,
    isLoadingHistory,
    addMessage,
    clearMessages,
    setIsLoadingHistory,
    handleSendMessage: sendChatMessage,
    queueMessage,
  } = useChatMessages({
    isConnected,
    sendMessage,
    getCurrentAgent,
    onError: handleError,
  });

  // Agent state and document management
  const {
    pendingRequests,
    addPendingRequest,
    removePendingRequest,
  } = useChatAgentState({
    currentAgent,
    documentId,
    isConnected,
    setCurrentAgent,
    clearMessages,
    setIsLoadingHistory,
    onError: handleError,
  });

  // Event subscriptions for WorkLog, UICommand, and SendChat
  useChatEvents({
    isConnected,
    addMessage,
    handleSendMessage: sendChatMessage,
    queueMessage,
    onShouldFocusInput: () => setShouldFocusInput(true),
  });

  // Handle input focus after user sends message
  useEffect(() => {
    if (shouldFocusInput && messageInputRef.current) {
      const focusInput = () => {
        messageInputRef.current?.focusInput();
        setShouldFocusInput(false);
      };
      
      // Use a longer timeout to ensure all updates are complete
      const timeoutId = setTimeout(focusInput, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldFocusInput]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !isConnected || !getCurrentAgent()) {
      return;
    }

    const messageToSend = messageInput;
    setIsLoading(true);
    setShouldFocusInput(true);

    try {
      await sendChatMessage(messageToSend);
      setMessageInput(''); // Clear input only after successful send
    } catch {
      // Error handling is done in the hook
      // Keep the message in the input field so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ 
      height: '100%', // Fill the container height provided by MainLayout
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden' // Prevent any overflow that might push content down
    }}>
      {/* Agent Header - only show when there are messages, EmptyState handles its own header */}
      {currentAgent && messages.length > 0 && (
        <AgentHeader 
          currentAgent={currentAgent} 
          isConnected={isConnected} 
        />
      )}

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        onClose={() => setError(null)} 
      />

      {/* Loading Indicators */}
      <LoadingIndicators 
        isLoading={isLoading || serviceLoading}
        isConnected={isConnected}
        isLoadingHistory={isLoadingHistory}
      />

      {/* Messages List */}
      <MessageList
        messages={messages}
        currentAgent={currentAgent}
        isLoadingHistory={isLoadingHistory}
        isLoading={isLoading || serviceLoading}
        isConnected={isConnected}
      />

      {/* Typing Indicator */}
      <TypingIndicator 
        isVisible={pendingRequests.size > 0}
      />

      {/* Message Input */}
      <MessageInput 
        ref={messageInputRef}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        isLoading={isLoading || serviceLoading}
        isConnected={isConnected}
        currentAgent={currentAgent}
      />
    </Box>
  );
};

export default ChatPanel; 