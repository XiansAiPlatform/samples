import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { ChatMessage as Message, ActivityData } from '../../../types';
import { Agents } from '../../../modules/poa/steps';

// Removed the local Message interface since we're importing the correct one from types

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

// Function to format message content with line breaks and basic markdown
// Memoized to avoid expensive recalculations
const useFormattedMessageContent = (content: string): JSX.Element => {
  return useMemo(() => {
    // Split by line breaks and process each line
    const lines = content.split('\n');
    
    return (
      <>
        {lines.map((line, lineIndex) => {
          if (line.trim() === '') {
            return <br key={lineIndex} />;
          }
          
          // Process markdown-like formatting within each line
          let formattedLine: (string | JSX.Element)[] = [line];
          
          // Bold text **text** or __text__
          formattedLine = formattedLine.flatMap((segment, segIndex) => {
            if (typeof segment !== 'string') return segment;
            
            const boldRegex = /(\*\*|__)(.*?)\1/g;
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            let match;
            
            while ((match = boldRegex.exec(segment)) !== null) {
              if (match.index > lastIndex) {
                parts.push(segment.slice(lastIndex, match.index));
              }
              parts.push(
                <strong key={`${lineIndex}-${segIndex}-bold-${match.index}`}>
                  {match[2]}
                </strong>
              );
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < segment.length) {
              parts.push(segment.slice(lastIndex));
            }
            
            return parts.length > 0 ? parts : [segment];
          });
          
          // Italic text *text* or _text_
          formattedLine = formattedLine.flatMap((segment, segIndex) => {
            if (typeof segment !== 'string') return segment;
            
            const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            let match;
            
            while ((match = italicRegex.exec(segment)) !== null) {
              if (match.index > lastIndex) {
                parts.push(segment.slice(lastIndex, match.index));
              }
              parts.push(
                <em key={`${lineIndex}-${segIndex}-italic-${match.index}`}>
                  {match[1] || match[2]}
                </em>
              );
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < segment.length) {
              parts.push(segment.slice(lastIndex));
            }
            
            return parts.length > 0 ? parts : [segment];
          });
          
          // Code text `code`
          formattedLine = formattedLine.flatMap((segment, segIndex) => {
            if (typeof segment !== 'string') return segment;
            
            const codeRegex = /`([^`]+)`/g;
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            let match;
            
            while ((match = codeRegex.exec(segment)) !== null) {
              if (match.index > lastIndex) {
                parts.push(segment.slice(lastIndex, match.index));
              }
              parts.push(
                <code 
                  key={`${lineIndex}-${segIndex}-code-${match.index}`}
                  className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono"
                >
                  {match[1]}
                </code>
              );
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < segment.length) {
              parts.push(segment.slice(lastIndex));
            }
            
            return parts.length > 0 ? parts : [segment];
          });
          
          return (
            <div key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
              {formattedLine}
            </div>
          );
        })}
      </>
    );
  }, [content]);
};

// Function to convert handoff message text from workflow IDs to agent titles
const formatHandoffMessage = (text: string): string => {
  // Expected format: 'Power of Attorney Agent v2:Representative Bot -> Power of Attorney Agent v2:Condition Bot'
  const handoffMatch = text.match(/(.+?)\s*->\s*(.+)/);
  
  if (!handoffMatch) {
    return text; // Return original text if format doesn't match
  }
  
  const fromWorkflowId = handoffMatch[1].trim();
  const toWorkflowId = handoffMatch[2].trim();
  
  // Find agents by matching the workflow ID (agents have "99x.io:" prefix)
  const fromAgent = Agents.find(agent => 
    agent.workflowId.includes(fromWorkflowId) || agent.workflowId.endsWith(fromWorkflowId)
  );
  const toAgent = Agents.find(agent => 
    agent.workflowId.includes(toWorkflowId) || agent.workflowId.endsWith(toWorkflowId)
  );
  
  // Use agent titles if found, otherwise fall back to original IDs
  const fromTitle = fromAgent?.title || fromWorkflowId;
  const toTitle = toAgent?.title || toWorkflowId;
  
  return `${fromTitle} → ${toTitle}`;
};

const ChatMessageDisplay: React.FC<ChatMessageProps> = ({ message, isLastMessage = false }) => {
  // Simple approach: Check if message has isHistorical flag to determine if it's new
  // New messages from the WebSocket won't have isHistorical: true
  const isNewMessage = !message.isHistorical;
  
  // Only highlight if it's a new message AND it's the last message in the conversation
  const shouldHighlight = isNewMessage && isLastMessage;
  const [isHighlighted, setIsHighlighted] = useState(shouldHighlight);
  const [isActivityLogExpanded, setIsActivityLogExpanded] = useState(false);

  // Memoize the formatted content to avoid expensive recalculations
  const formattedContent = useFormattedMessageContent(message.text);

  // Check if this message has ActivityLog data
  const hasActivityLog = message.activityLog && message.activityLog.length > 0;

  // Simple debug logging for ActivityLog data (only when present)
  useEffect(() => {
    if (message.direction === 'Outgoing' && hasActivityLog) {
      console.log('[ChatMessage] ✅ Agent message with ActivityLog:', {
        id: message.id,
        text: message.text.substring(0, 50) + '...',
        activityLogCount: message.activityLog?.length || 0
      });
    }
  }, [message, hasActivityLog]);

  useEffect(() => {
    // Only set up the timer if this message should be highlighted
    if (!shouldHighlight) return;

    // Set up timer to remove highlight after 5 seconds
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, 5000);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, [shouldHighlight]);

  // Component to render ActivityLog section
  const renderActivityLog = () => {
    if (!hasActivityLog || message.direction === 'Incoming') return null;

    return (
      <div className="mb-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setIsActivityLogExpanded(!isActivityLogExpanded)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full text-left hover:bg-gray-50 rounded px-1.5 py-1"
        >
          <svg 
            className={`w-2.5 h-2.5 transition-transform ${isActivityLogExpanded ? 'rotate-90' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">
            {message.activityLog!.length} work log{message.activityLog!.length === 1 ? '' : 's'}
          </span>
        </button>
        
        {isActivityLogExpanded && (
          <div className="mt-2 space-y-1.5">
            {message.activityLog!.map((activity, index) => (
              <div key={activity.id || index} className="bg-gray-50 rounded p-2 border-l-2 border-gray-300">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 mb-0.5">
                      {activity.success === false && (
                        <span className="text-red-500 mr-1">⚠️</span>
                      )}
                      {activity.summary}
                    </div>
                    {activity.details && (
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {activity.details}
                      </div>
                    )}
                    {activity.timestamp && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // console.log(`[ChatMessageDisplay] Rendering message ID: ${message.id}, direction: ${message.direction}`);
  if (message.messageType === 'Handoff') {
    const displayText = formatHandoffMessage(message.text);
    
    return (
      <div className="flex justify-center my-3">
        <div className={`bg-purple-50 text-purple-700 px-6 py-2 w-full max-w-lg text-xs font-medium text-center transition-all duration-500 ${
          isHighlighted 
            ? 'shadow-lg shadow-blue-200/50 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
            : ''
        }`}>
          <div className="flex items-center justify-center space-x-1 mb-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Handoff</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-purple-600">
            {displayText}
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.direction === 'Incoming';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`inline-block rounded-lg px-3 py-2 text-sm transition-all duration-500 ${
          isUser
            ? `bg-gray-100 text-gray-800 border border-gray-100 max-w-[75%] ${
                isHighlighted 
                  ? 'shadow-lg shadow-blue-200/50 bg-gradient-to-r from-blue-50 to-gray-100 border-blue-200' 
                  : 'shadow'
              }`
            : `bg-white border border-gray-100 text-gray-800 max-w-[85%] ${
                isHighlighted 
                  ? 'shadow-lg shadow-blue-200/50 bg-gradient-to-r from-blue-50 to-white border-blue-200' 
                  : 'shadow'
              } ${
                hasActivityLog ? 'border-l-2 border-l-gray-300' : ''
              }`
        }`}
      >
        {renderActivityLog()}
        
        <div className="relative">
          {formattedContent}
          {hasActivityLog && !isUser && (
            <div className="absolute -top-1 -right-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize ChatMessageDisplay for performance. It will only re-render if its `message` prop changes.
const ChatMessage = React.memo(ChatMessageDisplay);

export default ChatMessage; 