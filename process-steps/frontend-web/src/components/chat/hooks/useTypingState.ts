import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatMessage } from '../../../types'; // Assuming ChatMessage type is available

type TypingStage = 'contacting' | 'waiting' | 'long-wait';

export const useTypingState = (currentMessages: ChatMessage[]) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingStage, setTypingStage] = useState<TypingStage>('contacting');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const lastProcessedMessageCountRef = useRef(currentMessages.length);

  // Memoize the message count to avoid unnecessary effect triggers
  const currentMessageCount = useMemo(() => currentMessages.length, [currentMessages.length]);

  // Effect to stop typing indicator when a new BOT message or HANDOFF message arrives
  useEffect(() => {
    // Only proceed if we are currently in a typing state and there are new messages
    if (isTyping && currentMessageCount > lastProcessedMessageCountRef.current) {
      // Check all new messages since last processed count
      for (let i = lastProcessedMessageCountRef.current; i < currentMessageCount; i++) {
        const message = currentMessages[i];
        
        // Stop typing if we get an 'Outgoing' message (bot response) OR a Handoff message
        if (message && (message.direction === 'Outgoing' || message.messageType === 'Handoff')) {
          setIsTyping(false);
          break; // Stop checking once we find a reason to stop typing
        }
      }
    }
    
    // Always update the ref to the current message count
    lastProcessedMessageCountRef.current = currentMessageCount;
  }, [currentMessageCount, isTyping, currentMessages]); // Use memoized count and keep currentMessages for new message checking

  // Handle typing stage transitions AND add a maximum timeout
  useEffect(() => {
    if (!isTyping) {
      setTypingStage('contacting');
      setTypingStartTime(null);
      return;
    }

    // If typing just started, set the start time and initial stage
    if (typingStartTime === null) {
      setTypingStartTime(Date.now());
      setTypingStage('contacting');
    }

    const timer1 = setTimeout(() => {
      setTypingStage('waiting');
    }, 5000); // 5 seconds to 'waiting'

    const timer2 = setTimeout(() => {
      setTypingStage('long-wait');
    }, 35000); // 35 seconds total (5 + 30) to 'long-wait'

    // Safety timeout: stop typing after 60 seconds regardless
    const maxTimeout = setTimeout(() => {
      console.log('[useTypingState] Maximum 60s typing timeout reached. Stopping typing.');
      setIsTyping(false);
    }, 60000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(maxTimeout);
    };
  }, [isTyping, typingStartTime]);

  return {
    isTyping,
    setIsTyping, // Make sure ChatPane can still call setIsTyping(true) when sending a message
    typingStage,
  };
}; 