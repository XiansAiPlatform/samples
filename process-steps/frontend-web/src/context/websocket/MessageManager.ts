import { ChatMessage } from '../../types';
import { AgentManager } from './AgentManager';
import { Step } from './types';

export class MessageManager {
  private chatMessages = new Map<string, ChatMessage[]>();
  private threadIds = new Map<number, string>();
  private processedHistoricalMessages = new Set<string>();

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
    
    // Check for duplicate messages with safe timestamp comparison
    const isDuplicate = existingMessages.some(existing => {
      // ID-based comparison
      if (existing.id === message.id) {
        return true;
      }
      
      // Content and time-based comparison with safe timestamp handling
      if (existing.text === message.text) {
        try {
          const existingTime = existing.timestamp instanceof Date 
            ? existing.timestamp.getTime() 
            : new Date(existing.timestamp).getTime();
          const messageTime = message.timestamp instanceof Date 
            ? message.timestamp.getTime() 
            : new Date(message.timestamp).getTime();
          
          // Consider messages within 1 second as duplicates
          return Math.abs(existingTime - messageTime) < 1000;
        } catch (error) {
          console.warn('[MessageManager] Error comparing timestamps:', error);
          // Fall back to text-only comparison if timestamp parsing fails
          return true;
        }
      }
      
      return false;
    });
    
    if (isDuplicate) {
      console.log(`[MessageManager] Skipping duplicate message for workflowType ${workflowType}`);
      return;
    }
    
    // Store message by workflowType for shared chat history
    this.chatMessages.set(workflowType, [...existingMessages, message]);
    console.log(`[MessageManager] Added message to shared chat for workflowType: ${workflowType}`);

    if (message.threadId) {
      this.threadIds.set(message.stepIndex, message.threadId);
    }
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