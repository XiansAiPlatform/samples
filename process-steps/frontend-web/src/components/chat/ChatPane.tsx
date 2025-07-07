import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSteps } from '../../context/StepsContext';
import { useWebSocketSteps } from '../../context/websocket';

// Custom hooks
import { useChatMessages } from './hooks/useChatMessages';
import { useTypingState } from './hooks/useTypingState';
import { useChatScrolling } from './hooks/useChatScrolling';

// Components
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import SuggestionButtons from './components/SuggestionButtons';
import ChatInput from './components/ChatInput';

interface ChatPaneProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const ChatPane: React.FC<ChatPaneProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { activeStep, isInitialized } = useSteps();
  const { getChatMessagesForStep, handoffTypingStates } = useWebSocketSteps();
  
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY
  // Custom hooks for state management
  const {
    currentStep,
    currentAgent,
    hasBot,
    currentMessages,
    connectionState,
    isStepConnected,
    sendMessage,
    connectionStatusMessage,
  } = useChatMessages();

  const { isTyping: localIsTyping, setIsTyping: setLocalIsTyping, typingStage } = useTypingState(currentMessages);
  
  // Memoize typing state calculations to avoid unnecessary rerenders
  const handoffIsTyping = useMemo(() => 
    activeStep !== null ? (handoffTypingStates.get(activeStep) || false) : false,
    [activeStep, handoffTypingStates]
  );
  
  const isTyping = useMemo(() => 
    localIsTyping || handoffIsTyping,
    [localIsTyping, handoffIsTyping]
  );
  
  // Use "waiting" stage for handoff typing to indicate we're waiting for a response
  const effectiveTypingStage = useMemo(() => 
    handoffIsTyping ? 'waiting' : typingStage,
    [handoffIsTyping, typingStage]
  );
  
  const {
    isChatHistoryLoading,
    hasInitiallyLoaded,
    messagesEndRef,
    scrollContainerRef,
    scrollToBottom,
  } = useChatScrolling(activeStep, getChatMessagesForStep);

  // Suggestions state - now tracks collapsed vs expanded vs hidden
  const [suggestionsState, setSuggestionsState] = useState<'expanded' | 'collapsed' | 'hidden'>('expanded');

  // Optimized suggestion visibility logic - show expanded when no messages, collapsed when messages exist
  const shouldSuggestionsState = useMemo(() => 
    currentMessages.length === 0 ? 'expanded' : 'collapsed', 
    [currentMessages.length]
  );
  
  useEffect(() => {
    // Only update suggestionsState if the calculated value actually differs
    setSuggestionsState(prev => {
      if (prev !== shouldSuggestionsState) {
        return shouldSuggestionsState;
      }
      return prev; // Return same reference to prevent rerender
    });
  }, [shouldSuggestionsState, activeStep]);

  // Memoized and optimized message sending handler
  const handleSendMessage = useCallback(async (messageText: string) => {
    // Batch state updates using React's automatic batching in React 18+
    // or use unstable_batchedUpdates for older versions
    React.startTransition(() => {
      setLocalIsTyping(true);
      // Suggestions will automatically collapse due to message count change
    });

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setLocalIsTyping(false);
    }
  }, [sendMessage, setLocalIsTyping]);

  // Memoized suggestion handler
  const handleSuggestion = useCallback(async (suggestion: string) => {
    // Immediately collapse suggestions when user clicks a suggestion
    React.startTransition(() => {
      setSuggestionsState('collapsed');
    });
    
    await handleSendMessage(suggestion);
  }, [handleSendMessage]);

  // SINGLE RETURN STATEMENT WITH CONDITIONAL RENDERING
  return (
    <div className="flex flex-col h-full">
      {/* Loading state */}
      {(!isInitialized || !currentStep) && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-gray-500 text-sm">
              {!isInitialized ? 'Initializing...' : 'Loading step data...'}
            </div>
          </div>
        </div>
      )}

      {/* No bot state */}
      {isInitialized && currentStep && !hasBot && (
        <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500 text-sm p-4 text-center">
        </div>
      )}

      {/* Normal chat interface */}
      {isInitialized && currentStep && hasBot && (
        <>
          <ChatHeader
            bot={currentAgent || currentStep.bot!}
            theme={currentStep.theme}
            connectionState={connectionState}
            isStepConnected={isStepConnected}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
          />

          <MessageList
            messages={currentMessages}
            isTyping={isTyping}
            typingStage={effectiveTypingStage}
            connectionStatusMessage={connectionStatusMessage}
            isChatHistoryLoading={isChatHistoryLoading}
            hasInitiallyLoaded={hasInitiallyLoaded}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={scrollContainerRef}
            scrollToBottom={scrollToBottom}
          />

          {suggestionsState !== 'hidden' && isStepConnected && currentAgent?.suggestions && currentAgent.suggestions.length > 0 && (
            <SuggestionButtons
              theme={currentStep.theme}
              isTyping={isTyping}
              isCollapsed={suggestionsState === 'collapsed'}
              suggestions={currentAgent.suggestions}
              onSuggestionClick={handleSuggestion}
              onToggleCollapse={() => setSuggestionsState(prev => 
                prev === 'collapsed' ? 'expanded' : 'collapsed'
              )}
            />
          )}

          <ChatInput
            botTitle={currentAgent?.title || currentStep.bot?.title}
            isStepConnected={isStepConnected}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
          />
        </>
      )}
    </div>
  );
};

export default ChatPane; 