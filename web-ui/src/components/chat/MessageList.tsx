import React, { useRef, useEffect } from 'react';
import { Box, List } from '@mui/material';
import type { ChatMessage as ChatMessageType, Bot } from '../../types';
import ChatMessageComponent from './ChatMessage';
import WorkLogMessageGroup from './WorkLogMessageGroup';
import AgentHeader from './AgentHeader';
import { groupMessages } from '../../utils/messageHelpers';

interface MessageListProps {
  messages: ChatMessageType[];
  currentAgent?: Bot | null;
  isLoadingHistory: boolean;
  isLoading: boolean;
  isConnected?: boolean;
}

const EmptyState: React.FC<{ currentAgent?: Bot | null; isConnected?: boolean }> = ({ currentAgent, isConnected = false }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}
  >
    {/* Show AgentHeader when in empty state */}
    {currentAgent && (
      <AgentHeader 
        currentAgent={currentAgent} 
        isConnected={isConnected}
        forceExpanded={true}
      />
    )}
    
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        textAlign: 'center',
        px: 3,
        py: 6,
      }}
    >
      <Box
        sx={{
          color: 'text.secondary',
          fontSize: '1.1rem',
          fontWeight: 500,
          mb: 1,
        }}
      >
        {currentAgent ? `Welcome to ${currentAgent.name}!` : 'Welcome!'}
      </Box>
      <Box
        sx={{
          color: 'text.disabled',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          maxWidth: 400,
        }}
      >
        Send a message to begin working with your AI assistant, or click on a capability above to get started.
      </Box>
    </Box>
  </Box>
);

/**
 * Component responsible for rendering the list of chat messages
 */
const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentAgent,
  isLoadingHistory,
  isLoading,
  isConnected = false,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const shouldShowEmptyState = messages.length === 0 && !isLoadingHistory && !isLoading;

  return (
    <Box 
      ref={messagesContainerRef}
      sx={{ 
        flex: 1, // Take up all available space
        overflow: 'auto',
        overflowX: 'hidden', // Prevent horizontal scroll
        px: 1, // Reduced from 2 to 1 for more horizontal space
        py: 1.5, // Reduced from 2 to 1.5
        minHeight: 0 // Allow shrinking to zero if needed
      }}
    >
      {shouldShowEmptyState ? (
        <EmptyState currentAgent={currentAgent} isConnected={isConnected} />
      ) : (
        <List sx={{ p: 0 }}>
          {groupMessages(messages).map((group, index) => {
            if (group.type === 'worklog') {
              return (
                <WorkLogMessageGroup
                  key={`worklog-group-${index}-${group.messages[0]?.id}`}
                  messages={group.messages}
                  isGrouped={group.isGrouped}
                />
              );
            } else {
              return group.messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                />
              ));
            }
          })}
        </List>
      )}
    </Box>
  );
};

export default MessageList;