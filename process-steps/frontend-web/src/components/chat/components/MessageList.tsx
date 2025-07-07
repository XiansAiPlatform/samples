import React, { useEffect, useCallback, useMemo } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import LoadingIndicator from './LoadingIndicator';
import { ChatMessage as Message } from '../../../types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  typingStage: 'contacting' | 'waiting' | 'long-wait';
  connectionStatusMessage: string | null;
  isChatHistoryLoading: boolean;
  hasInitiallyLoaded: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: (forceSmooth?: boolean) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  typingStage,
  connectionStatusMessage,
  isChatHistoryLoading,
  hasInitiallyLoaded,
  messagesEndRef,
  scrollContainerRef,
  scrollToBottom,
}) => {
  // Memoize messages length to avoid unnecessary effect triggers
  const messagesLength = useMemo(() => messages.length, [messages.length]);
  
  // Combine scroll triggers into a single effect to reduce rerenders
  useEffect(() => {
    if (!hasInitiallyLoaded) return;
    
    // Scroll when messages change or typing status changes
    scrollToBottom();
  }, [messagesLength, isTyping, hasInitiallyLoaded, scrollToBottom]);

  // Handle typing indicator content changes (when ActivityLog updates change height)
  const handleTypingIndicatorContentChange = useCallback(() => {
    if (!hasInitiallyLoaded) return;
    // Use a small delay to ensure DOM has updated before scrolling
    setTimeout(() => {
      scrollToBottom(true); // Force smooth scroll for typing indicator changes
    }, 50);
  }, [hasInitiallyLoaded, scrollToBottom]);

  // Memoize the messages rendering to prevent unnecessary rerenders
  const renderedMessages = useMemo(() => {
    // Find the last message overall (regardless of direction)
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;
    
    return messages.map((msg) => (
      <ChatMessage 
        key={msg.id} 
        message={msg} 
        isLastMessage={msg.id === lastMessageId}
      />
    ));
  }, [messages]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 bg-gray-50"
    >
      <div className="w-full max-w-sm ml-auto space-y-4">
        {connectionStatusMessage && (
          <div className="text-center text-sm text-gray-500 py-4">
            {connectionStatusMessage}
          </div>
        )}
        
        {isChatHistoryLoading ? (
          <LoadingIndicator />
        ) : (
          <div className={`transition-opacity duration-300 space-y-4 ${hasInitiallyLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {renderedMessages}
            
            {isTyping && (
              <TypingIndicator 
                typingStage={typingStage} 
                onContentChange={handleTypingIndicatorContentChange}
              />
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Memoize the entire component to prevent rerenders when props haven't changed
export default React.memo(MessageList); 