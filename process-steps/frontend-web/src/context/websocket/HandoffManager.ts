import { ChatMessage } from '../../types';
import { AgentManager } from './AgentManager';
import { ConnectionManager } from './ConnectionManager';
import { Step, Agent } from './types';

export class HandoffManager {
  private handoffTypingStates = new Map<number, boolean>();
  private handoffTypingTimers = new Map<number, number>();
  private handoffNavigationTimeout: number | null = null;

  constructor(
    private agentManager: AgentManager,
    private connectionManager: ConnectionManager
  ) {}

  getHandoffTypingStates(): Map<number, boolean> {
    return new Map(this.handoffTypingStates);
  }

  setHandoffTyping(stepIndex: number, isTyping: boolean): void {
    // Clean up any existing timer for this step when manually setting typing state
    const existingTimer = this.handoffTypingTimers.get(stepIndex);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.handoffTypingTimers.delete(stepIndex);
    }
    
    if (isTyping) {
      this.handoffTypingStates.set(stepIndex, true);
    } else {
      this.handoffTypingStates.delete(stepIndex);
    }
  }

  async getTargetStepFromHandoffMessage(message: ChatMessage, steps: Step[]): Promise<number | null> {
    console.log(`[HandoffManager] 🔍 Processing handoff message for target step detection`);
    
    // Extract workflowId from the message data - check multiple possible locations
    const workflowId = message.data?.workflowId || 
                      message.data?.WorkflowId || 
                      message.data?.metadata?.workflowId ||
                      message.data?.metadata?.WorkflowId ||
                      message.data?.targetWorkflowId ||
                      message.data?.TargetWorkflowId ||
                      message.data?.handoffTo ||
                      message.data?.HandoffTo ||
                      (message as any).workflowId ||  // Check top-level message
                      (message as any).WorkflowId;
    
    console.log(`[HandoffManager] 🎯 Extracted workflowId:`, workflowId);
    
    // Delegate to the agent manager
    const result = await this.agentManager.getStepIndexFromHandoffMessage({
      text: message.text,
      data: message.data,
      workflowId: workflowId
    }, steps);
    
    console.log(`[HandoffManager] 📍 Step mapping result:`, result);
    return result;
  }

  async refreshChatHistoryForStep(targetStepIndex: number, steps: Step[]): Promise<void> {
    const hub = this.connectionManager.getHub();
    if (!hub || targetStepIndex < 0 || targetStepIndex >= steps.length) {
      return;
    }
    
    const targetStep = steps[targetStepIndex];
    if (!targetStep?.botId) {
      return;
    }
    
    const targetAgent = await this.agentManager.getAgentById(targetStep.botId);
    if (!targetAgent) {
      return;
    }
    
    try {
      console.log(`[HandoffManager] Refreshing chat history for step ${targetStepIndex} (${targetStep.title})`);
      
      // Show typing indicator for the target step
      this.setHandoffTyping(targetStepIndex, true);
      console.log(`[HandoffManager] 💬 Showing handoff typing indicator for step ${targetStepIndex}`);
      
      // Check if there's an active connection for this agent
      if (!targetAgent.workflowType) {
        console.warn(`[HandoffManager] Agent has no workflowType: ${targetAgent.id}`);
        return;
      }
      
      const connectionState = hub.getAgentConnectionStateByWorkflowType(targetAgent.workflowType);
      
      if (connectionState?.status === 'connected') {
        try {
          console.log(`[HandoffManager] 🔄 Agent ${targetAgent.workflowId} is connected, requesting fresh thread history`);
          
          // Use the clean SDK API to request thread history refresh
          const success = await hub.refreshThreadHistory(targetAgent.workflowType);
          
          if (success) {
            console.log(`[HandoffManager] ✅ Successfully requested thread history for step ${targetStepIndex}`);
            
            // Hide typing indicator after a short delay to allow messages to arrive
            setTimeout(() => {
              this.setHandoffTyping(targetStepIndex, false);
              console.log(`[HandoffManager] 💬 Hiding handoff typing indicator for step ${targetStepIndex} after history refresh`);
            }, 1500);
          } else {
            console.warn(`[HandoffManager] Failed to request thread history for step ${targetStepIndex}, using timeout fallback`);
            setTimeout(() => this.setHandoffTyping(targetStepIndex, false), 2000);
          }
          
        } catch (historyError) {
          console.warn(`[HandoffManager] Failed to request thread history for step ${targetStepIndex}:`, historyError);
          // Fall back to timeout-based hiding
          setTimeout(() => this.setHandoffTyping(targetStepIndex, false), 2000);
        }
      } else {
        console.warn(`[HandoffManager] Agent ${targetAgent.workflowId} not connected (status: ${connectionState?.status}), using timeout fallback`);
        setTimeout(() => this.setHandoffTyping(targetStepIndex, false), 2000);
      }
      
    } catch (error) {
      console.error(`[HandoffManager] Error refreshing chat history for step ${targetStepIndex}:`, error);
      // Hide typing indicator on error
      this.setHandoffTyping(targetStepIndex, false);
    }
  }

  async handleHandoff(
    handoff: any,
    activeStep: number | null,
    steps: Step[],
    setActiveStep: (stepIndex: number) => void
  ): Promise<void> {
    console.log(`[HandoffManager] 🚀 Handoff message received:`, {
      workflowId: handoff.workflowId,
      text: handoff.text,
      isHistorical: handoff.isHistorical,
      currentStep: activeStep
    });
    
    // Only process navigation for new handoff messages, not historical ones
    if (handoff.isHistorical) {
      console.log(`[HandoffManager] 📜 Skipping navigation for historical handoff message`);
      return;
    }
    
    // Clear any existing navigation timeout
    if (this.handoffNavigationTimeout) {
      clearTimeout(this.handoffNavigationTimeout);
    }
    
    // Create a ChatMessage object for getTargetStepFromHandoffMessage
    const stepIndex = await this.agentManager.workflowIdToStepIndex(handoff.workflowId, steps, activeStep);
    
    const handoffChatMessage: ChatMessage = {
      id: `handoff-${Date.now()}-${Math.random()}`,
      text: handoff.text,
      direction: handoff.direction,
      messageType: 'Handoff',
      timestamp: handoff.timestamp,
      stepIndex: stepIndex,
      threadId: handoff.threadId,
      data: handoff.data,
      isHistorical: handoff.isHistorical
    };
    
    // Determine target step from handoff message
    const targetStepIndex = await this.getTargetStepFromHandoffMessage(handoffChatMessage, steps);
    
    console.log(`[HandoffManager] 🧭 Navigation decision: targetStepIndex=${targetStepIndex}, activeStep=${activeStep}`);
    
    if (targetStepIndex !== null && targetStepIndex !== activeStep) {
      console.log(`[HandoffManager] ✅ Initiating navigation to step ${targetStepIndex} due to handoff`);
      
      // Refresh chat history for the target step to get complete conversation context
      await this.refreshChatHistoryForStep(targetStepIndex, steps);
      
      // Navigate to the target step after a short delay to ensure the handoff message is visible
      this.handoffNavigationTimeout = setTimeout(() => {
        console.log(`[HandoffManager] 🚀 Executing setActiveStep(${targetStepIndex})`);
        setActiveStep(targetStepIndex);
        this.handoffNavigationTimeout = null;
      }, 800); // Reduced delay for better UX
      
    } else if (targetStepIndex === null) {
      console.warn(`[HandoffManager] ⚠️ Could not determine target step from handoff message`);
    } else {
      console.log(`[HandoffManager] 🔄 Already on target step ${targetStepIndex}, refreshing chat history`);
      await this.refreshChatHistoryForStep(targetStepIndex, steps);
    }
  }

  setHandoffTypingWithTimer(stepIndex: number, delay: number = 1000): void {
    console.log(`[HandoffManager] 💬 Clearing handoff typing with delay for step ${stepIndex}`);
    const timerId = setTimeout(() => {
      console.log(`[HandoffManager] 💬 Clearing handoff typing indicator for step ${stepIndex} after delay`);
      this.setHandoffTyping(stepIndex, false);
      this.handoffTypingTimers.delete(stepIndex);
    }, delay);
    this.handoffTypingTimers.set(stepIndex, timerId);
  }

  clearHandoffTypingImmediately(stepIndex: number): void {
    console.log(`[HandoffManager] 💬 Clearing handoff typing immediately for step ${stepIndex}`);
    this.setHandoffTyping(stepIndex, false);
  }

  cleanup(): void {
    // Clear navigation timeout
    if (this.handoffNavigationTimeout) {
      clearTimeout(this.handoffNavigationTimeout);
      this.handoffNavigationTimeout = null;
    }
    
    // Clear all handoff typing timers
    this.handoffTypingTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.handoffTypingTimers.clear();
    this.handoffTypingStates.clear();
  }
} 