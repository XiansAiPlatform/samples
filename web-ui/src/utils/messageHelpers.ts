import type { ChatMessage as ChatMessageType } from '../types';

/**
 * Represents a group of messages of the same type
 */
export interface MessageGroup {
  type: 'chat' | 'worklog';
  messages: ChatMessageType[];
  isGrouped: boolean;
}

/**
 * Groups consecutive messages by type (chat vs worklog)
 * Worklog messages that appear consecutively are marked as grouped
 */
export const groupMessages = (messages: ChatMessageType[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  let currentGroup: ChatMessageType[] = [];
  let currentType: 'chat' | 'worklog' | null = null;

  for (const message of messages) {
    const isWorkLog = message.metadata?.isWorkLogMessage === true;
    const messageType = isWorkLog ? 'worklog' : 'chat';

    if (messageType !== currentType) {
      // Save the previous group if it exists
      if (currentGroup.length > 0 && currentType) {
        groups.push({
          type: currentType,
          messages: currentGroup,
          isGrouped: currentType === 'worklog' && currentGroup.length > 1,
        });
      }
      // Start a new group
      currentGroup = [message];
      currentType = messageType;
    } else {
      // Add to current group
      currentGroup.push(message);
    }
  }

  // Add the last group
  if (currentGroup.length > 0 && currentType) {
    groups.push({
      type: currentType,
      messages: currentGroup,
      isGrouped: currentType === 'worklog' && currentGroup.length > 1,
    });
  }

  return groups;
};

/**
 * Checks if a message is a duplicate based on ID and content
 * Only applies to history messages
 */
export const isDuplicateMessage = (
  newMessage: ChatMessageType,
  existingMessages: ChatMessageType[]
): boolean => {
  if (!newMessage.metadata?.isHistoryMessage) {
    return false;
  }

  const messageSocketData = newMessage.metadata?.socketMessage as { id?: string } | undefined;
  const messageId = messageSocketData?.id || newMessage.id;

  return existingMessages.some(existingMessage => {
    // Only compare with other history messages
    if (!existingMessage.metadata?.isHistoryMessage) {
      return false;
    }

    const existingSocketData = existingMessage.metadata?.socketMessage as { id?: string } | undefined;
    const existingId = existingSocketData?.id || existingMessage.id;

    // Match by ID first
    if (messageId && existingId && messageId === existingId) {
      return true;
    }

    // If IDs don't match or are missing, check by content and timestamp
    if (existingMessage.content === newMessage.content && 
        Math.abs(existingMessage.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000) {
      return true;
    }

    return false;
  });
};

/**
 * Creates a user message object
 */
export const createUserMessage = (content: string, id?: string): ChatMessageType => ({
  id: id || `user-${Date.now()}`,
  content,
  sender: 'user',
  timestamp: new Date(),
  type: 'text',
});

interface MessagePayload {
  message: {
    id?: string;
    createdAt?: string;
  };
  data?: unknown;
  messageSubject?: string;
}

/**
 * Creates a worklog message object from data message payload
 */
export const createWorkLogMessage = (payload: MessagePayload): ChatMessageType => ({
  id: `worklog-${payload.message.id || Date.now()}`,
  content: typeof payload.data === 'string' 
    ? payload.data 
    : 'WorkLog update received, please wait for the agent to respond',
  sender: 'agent',
  timestamp: new Date(payload.message.createdAt || Date.now()),
  type: 'text',
  metadata: {
    isWorkLogMessage: true,
    socketMessage: payload.message,
    messageSubject: payload.messageSubject,
  },
});

/**
 * Creates a UI component message object from data message payload
 */
export const createUIComponentMessage = (payload: MessagePayload): ChatMessageType => ({
  id: `ui-component-${payload.message.id || Date.now()}`,
  content: '', // No text content, just the component
  sender: 'agent',
  timestamp: new Date(payload.message.createdAt || Date.now()),
  type: 'action',
  metadata: {
    isUIComponent: true,
    uiComponentData: payload.data,
    socketMessage: payload.message,
    messageSubject: payload.messageSubject,
  },
});