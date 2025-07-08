import { ChatMessage } from '../../types';
import { AgentManager } from './AgentManager';
import { Step } from './types';

export class MessageManager {
  private chatMessages = new Map<string, ChatMessage[]>();
  private threadIds = new Map<number, string>();
  private processedHistoricalMessages = new Set<string>();
  private pendingMessages: { message: ChatMessage; steps: Step[] }[] = [];

  constructor(private agentManager: AgentManager) {}

  getChatMessages(): Map<string, ChatMessage[]> {
    return new Map(this.chatMessages);
  }

  getThreadId(stepIndex: number): string | undefined {
    return this.threadIds.get(stepIndex);
  }

  getChatMessagesForStep(stepIndex: number, steps: Step[]): ChatMessage[] {
    if (stepIndex < 0 || stepIndex >= steps.length) return [];
    const step = steps[stepIndex];
    if (!step?.botId) return [];
    
    // Try to get agent from cache first
    const agents = this.agentManager['agentsCache']; // Access cached agents directly
    
    // If not in cache, we can't get the workflowType synchronously
    if (!agents) {
      console.log(`[MessageManager] Agents not in cache for step ${stepIndex}, botId: ${step.botId}`);
      return [];
    }
    
    const agent = agents.find((a: any) => a.id === step.botId);
    const workflowType = agent?.workflowType;
    if (!workflowType) {
      console.log(`[MessageManager] No workflowType for agent: ${step.botId}`);
      return [];
    }
    
    return this.chatMessages.get(workflowType) || [];
  }

  async addChatMessage(message: ChatMessage, steps: Step[]): Promise<void> {
    // If no steps available yet, queue the message for later processing
    if (steps.length === 0) {
      console.log(`[MessageManager] No steps available, queueing message for later processing: ${message.text?.substring(0, 50)}...`);
      this.pendingMessages.push({ message, steps: [] }); // We'll use latest steps when processing
      return;
    }

    // Get workflowType for this message - ensure agents are loaded first
    let workflowType: string | null = null;
    
    if (steps.length > 0 && message.stepIndex >= 0 && message.stepIndex < steps.length) {
      const step = steps[message.stepIndex];
      if (step?.botId) {
        // Ensure agents are loaded
        const agents = await this.agentManager.getAgentsForCurrentModule();
        const agent = agents.find((a: any) => a.id === step.botId);
        workflowType = agent?.workflowType || null;
      }
    }
    
    if (!workflowType) {
      console.warn(`[MessageManager] No workflowType found for step ${message.stepIndex}, skipping message`);
      return;
    }

    // Prevent duplicate historical messages
    if (message.isHistorical) {
      const messageKey = `${message.id || message.text}-${message.timestamp}-${workflowType}`;
      if (this.processedHistoricalMessages.has(messageKey)) {
        console.log(`[MessageManager] Skipping duplicate historical message: ${messageKey}`);
        return;
      }
      this.processedHistoricalMessages.add(messageKey);
      
      // Limit historical message cache size to prevent memory leaks
      if (this.processedHistoricalMessages.size > 1000) {
        const oldMessages = Array.from(this.processedHistoricalMessages).slice(0, 500);
        oldMessages.forEach(msg => this.processedHistoricalMessages.delete(msg));
      }
    }

    const existingMessages = this.chatMessages.get(workflowType) || [];
    
    // Check for duplicate messages (by ID or content)
    if (message.id) {
      const isDuplicate = existingMessages.some(msg => msg.id === message.id);
      if (isDuplicate) {
        console.log(`[MessageManager] Skipping duplicate message with ID: ${message.id}`);
        return;
      }
    } else {
      // For messages without ID, check by content and timestamp
      const isDuplicate = existingMessages.some(msg => {
        if (msg.text !== message.text) return false;
        
        const msgTime = typeof msg.timestamp === 'number' ? msg.timestamp : 
                       msg.timestamp instanceof Date ? msg.timestamp.getTime() : 0;
        const messageTime = typeof message.timestamp === 'number' ? message.timestamp : 
                           message.timestamp instanceof Date ? message.timestamp.getTime() : 0;
        
        return Math.abs(msgTime - messageTime) < 1000; // Within 1 second
      });
      if (isDuplicate) {
        console.log(`[MessageManager] Skipping duplicate message by content`);
        return;
      }
    }
    
    // Sort messages by timestamp
    const updatedMessages = [...existingMessages, message].sort((a, b) => {
      const timeA = typeof a.timestamp === 'number' ? a.timestamp : 
                   a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const timeB = typeof b.timestamp === 'number' ? b.timestamp : 
                   b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return timeA - timeB;
    });
    
    this.chatMessages.set(workflowType, updatedMessages);
    console.log(`[MessageManager] Added message to workflowType "${workflowType}". Total messages: ${updatedMessages.length}`);

    if (message.threadId) {
      this.threadIds.set(message.stepIndex, message.threadId);
    }
  }

  async processPendingMessages(steps: Step[]): Promise<void> {
    if (this.pendingMessages.length === 0 || steps.length === 0) {
      return;
    }

    console.log(`[MessageManager] Processing ${this.pendingMessages.length} pending messages with ${steps.length} steps`);
    
    const messagesToProcess = [...this.pendingMessages];
    this.pendingMessages = []; // Clear pending messages
    
    for (const { message } of messagesToProcess) {
      // Re-calculate step index using current steps
      const agents = await this.agentManager.getAgentsForCurrentModule();
      
      // Find the step that matches this message's workflow
      // We need to extract workflowId from the original message context
      let newStepIndex = message.stepIndex;
      
      // Try to map the message to the correct step based on available information
      const messageWorkflowId = (message as any).workflowId || (message.data as any)?.workflowId;
      if (messageWorkflowId) {
        newStepIndex = await this.agentManager.workflowIdToStepIndex(messageWorkflowId, steps, null);
      } else if (message.stepIndex === 0 && steps.length > 0) {
        // If it was defaulted to 0, try to find the right step
        // This is a heuristic - we'll use the first step with a bot
        const firstStepWithBot = steps.findIndex(step => step.botId);
        if (firstStepWithBot >= 0) {
          newStepIndex = firstStepWithBot;
        }
      }
      
      // Update message with correct step index
      const updatedMessage = { ...message, stepIndex: newStepIndex };
      
      // Process the message normally
      await this.addChatMessage(updatedMessage, steps);
    }
    
    console.log(`[MessageManager] Finished processing pending messages`);
  }

  createUserMessage(text: string, stepIndex: number, threadId?: string): ChatMessage {
    return {
      id: `user-${Date.now()}-${Math.random()}`,
      text: text,
      direction: 'Incoming',
      messageType: 'Chat',
      timestamp: new Date(),
      stepIndex: stepIndex,
      threadId: threadId,
      isHistorical: false
    };
  }

  getMessageStoreStats() {
    return {
      totalWorkflowTypes: Array.from(new Set([...this.chatMessages.keys()])).length,
      totalChatMessages: Array.from(this.chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      workflowTypeStats: Array.from(new Set([...this.chatMessages.keys()])).reduce((acc, workflowType) => {
        acc[workflowType] = {
          chat: this.chatMessages.get(workflowType)?.length || 0
        };
        return acc;
      }, {} as Record<string, { chat: number }>)
    };
  }

  clear(): void {
    this.chatMessages.clear();
    this.threadIds.clear();
    this.processedHistoricalMessages.clear();
  }
} 