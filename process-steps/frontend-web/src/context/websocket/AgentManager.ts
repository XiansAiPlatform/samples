import { getModuleBySlug } from '../../modules/modules';
import { Agent, Step } from './types';

export class AgentManager {
  private agentsCache: Agent[] | null = null;
  private agentsCacheModuleSlug: string | null = null;

  constructor(private moduleSlug: string) {}

  async getAgentsForCurrentModule(): Promise<Agent[]> {
    // Use cache if available and for same module
    if (this.agentsCache && this.agentsCacheModuleSlug === this.moduleSlug) {
      return this.agentsCache;
    }
    
    try {
      const module = getModuleBySlug(this.moduleSlug);
      if (!module) return [];
      
      const { Agents } = await module.stepsLoader();
      
      // Update cache
      this.agentsCache = Agents;
      this.agentsCacheModuleSlug = this.moduleSlug;
      
      return Agents;
    } catch (error) {
      console.warn('Failed to load agents for module:', this.moduleSlug, error);
      return [];
    }
  }

  async getAgentById(botId: string): Promise<Agent | null> {
    const agents = await this.getAgentsForCurrentModule();
    return agents.find((agent: Agent) => agent.id === botId) || null;
  }

  async getAgentForStep(stepIndex: number, steps: Step[]): Promise<Agent | null> {
    if (stepIndex < 0 || stepIndex >= steps.length) return null;
    const step = steps[stepIndex];
    if (!step?.botId) return null;
    return await this.getAgentById(step.botId);
  }

  async getWorkflowTypeForStep(stepIndex: number, steps: Step[]): Promise<string | null> {
    if (stepIndex < 0 || stepIndex >= steps.length) return null;
    const step = steps[stepIndex];
    if (!step?.botId) return null;
    const agent = await this.getAgentById(step.botId);
    return agent?.workflowType || null;
  }

  async getStepIndexFromHandoffMessage(message: { text: string; data?: any; workflowId?: string }, steps: Step[]): Promise<number | null> {
    try {
      const agents = await this.getAgentsForCurrentModule();
      
      // Extract workflowId from various possible locations
      const workflowId = message.workflowId || 
                        message.data?.workflowId || 
                        message.data?.WorkflowId || 
                        message.data?.metadata?.workflowId ||
                        message.data?.metadata?.WorkflowId ||
                        message.data?.targetWorkflowId ||
                        message.data?.TargetWorkflowId ||
                        message.data?.handoffTo ||
                        message.data?.HandoffTo;
      
      if (!workflowId) {
        console.warn('[AgentManager] No workflowId found in handoff message');
        return null;
      }
      
      // Find matching agent
      const targetAgent = agents.find((agent: Agent) => 
        agent.workflowType === workflowId ||
        agent.workflowType?.includes(workflowId) ||
        agent.workflowType?.endsWith(workflowId)
      );
      
      if (!targetAgent) {
        console.warn(`[AgentManager] No agent found for workflowId: ${workflowId}`);
        return null;
      }
      
      // Find step index for this agent
      const stepIndex = steps.findIndex(step => step.botId === targetAgent.id);
      return stepIndex >= 0 ? stepIndex : null;
      
    } catch (error) {
      console.error('[AgentManager] Error in getStepIndexFromHandoffMessage:', error);
      return null;
    }
  }

  async workflowIdToStepIndex(workflowId: string, steps: Step[], activeStep: number | null): Promise<number> {
    // If no steps available (dashboard route), return 0 as default
    if (steps.length === 0) {
      console.log(`[AgentManager] No steps available, using default step index 0 for workflowId "${workflowId}"`);
      return 0;
    }
    
    // Ensure agents are loaded
    const agents = await this.getAgentsForCurrentModule();
    
    // Find all steps that match this workflowType
    const matchingSteps: number[] = [];
    steps.forEach((step, index) => {
      if (!step.botId) return;
      const agent = agents.find((a: Agent) => a.id === step.botId);
      if (agent?.workflowType === workflowId) {
        matchingSteps.push(index);
      }
    });
    
    console.log(`[AgentManager] Found ${matchingSteps.length} steps matching workflowId "${workflowId}": [${matchingSteps.join(', ')}]`);
    
    // If multiple steps share the same workflowType, route to the active step if it's one of them
    if (matchingSteps.length > 1 && activeStep !== null && matchingSteps.includes(activeStep)) {
      console.log(`[AgentManager] Multiple steps found, routing to active step: ${activeStep}`);
      return activeStep;
    }
    
    // Otherwise, use the first matching step (original behavior)
    const stepIndex = matchingSteps.length > 0 ? matchingSteps[0] : 0;
    console.log(`[AgentManager] Mapping workflowId "${workflowId}" to step index: ${stepIndex}`);
    return stepIndex;
  }

  clearCache(): void {
    this.agentsCache = null;
    this.agentsCacheModuleSlug = null;
  }

  updateModuleSlug(newModuleSlug: string): void {
    if (this.moduleSlug !== newModuleSlug) {
      this.moduleSlug = newModuleSlug;
      this.clearCache();
    }
  }
} 