import { ConnectionState } from '../../types';
import AgentSDK from '@99xio/xians-sdk-typescript';
import { Settings, Step, Agent } from './types';
import { AgentManager } from './AgentManager';

export class ConnectionManager {
  private connectionStates = new Map<number, ConnectionState>();
  private workflowConnectionStates = new Map<string, ConnectionState>();
  private isConnected = false;
  private hubRef: AgentSDK | null = null;

  constructor(private agentManager: AgentManager) {}

  getConnectionStates(): Map<number, ConnectionState> {
    return new Map(this.connectionStates);
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getHub(): AgentSDK | null {
    return this.hubRef;
  }

  async initializeSDK(settings: Settings): Promise<AgentSDK> {
    // Try to get existing shared SDK or initialize one with proper settings
    let sdk: AgentSDK;
    try {
      sdk = AgentSDK.getShared();
      console.log('[ConnectionManager] Using existing shared SDK instance');
    } catch {
      // Initialize shared SDK with validated settings
      console.log('[ConnectionManager] Initializing shared SDK instance with settings:', {
        agentWebsocketUrl: settings.agentWebsocketUrl,
        hasAuth: !!(settings.Authorization || settings.agentApiKey),
        tenantId: settings.tenantId,
        participantId: settings.participantId
      });
      
      // Try to trigger DocumentService initialization first for proper SDK setup
      try {
        // Use dynamic import to avoid circular dependencies
        import('../../modules/poa/services/DocumentService').then(({ DocumentService }) => {
          try {
            DocumentService.getInstance();
            console.log('[ConnectionManager] DocumentService initialized successfully');
          } catch (initError) {
            console.warn('[ConnectionManager] DocumentService initialization failed:', initError);
          }
        }).catch((importError) => {
          console.warn('[ConnectionManager] Could not import DocumentService:', importError);
        });
      } catch (docServiceError) {
        console.warn('[ConnectionManager] DocumentService setup failed:', docServiceError);
      }
      
      // Create our own shared SDK instance
      sdk = AgentSDK.initShared({
        agentWebsocketUrl: settings.agentWebsocketUrl,
        Authorization: settings.Authorization || settings.agentApiKey || '',
        tenantId: settings.tenantId,
        participantId: settings.participantId,
        getDefaultData: () => {
          return settings.defaultMetadata || undefined;
        }
      });
    }
    
    this.hubRef = sdk;
    
    // Schedule a check for agent connection states after initialization completes
    setTimeout(() => {
      this.updateConnectionStatesFromSDK();
    }, 1500);
    
    return sdk;
  }

  // Manually update connection states based on current SDK state
  updateConnectionStatesFromSDK(): void {
    if (!this.hubRef) return;
    
    try {
      // Check connection states from the SDK
      const stats = this.hubRef.getStats();
      console.log('[ConnectionManager] Checking SDK connection stats:', stats);
      
      // Update workflow connection states based on SDK connection stats
      // Note: This is a fallback mechanism if connection_change events aren't fired
      if (stats && stats.connectionStats) {
        let hasConnectedAgents = false;
        
        // connectionStats is an array of [number, ConnectionState] tuples
        for (const [stepIndex, connectionState] of stats.connectionStats) {
          if (connectionState && connectionState.status === 'connected') {
            hasConnectedAgents = true;
            console.log(`[ConnectionManager] Detected connected connection at step ${stepIndex}:`, connectionState);
            
            // Store connection state for ALL connected steps, not just step 0
            this.connectionStates.set(stepIndex, {
              status: 'connected',
              stepIndex: stepIndex,
              lastActivity: new Date()
            });
            console.log(`[ConnectionManager] Updated connection state for step ${stepIndex} from SDK stats`);
          }
        }
        
        if (hasConnectedAgents && !this.isConnected) {
          console.log('[ConnectionManager] 🔄 Manually updating connection state to connected based on SDK stats');
          this.isConnected = true;
        }
      }
    } catch (error) {
      console.warn('[ConnectionManager] Error checking SDK connection states:', error);
    }
  }

  async handleConnectionChange(ev: { workflowId: string; data: ConnectionState }, steps: Step[], hasSteps: boolean): Promise<void> {
    // Always track workflow connection state, regardless of route type
    this.workflowConnectionStates.set(ev.workflowId, ev.data);
    
    // If no steps available (dashboard route), update global connection state based on all workflows
    if (!hasSteps || steps.length === 0) {
      const connectedWorkflows = Array.from(this.workflowConnectionStates.values()).filter(state => state.status === 'connected');
      const newIsConnected = connectedWorkflows.length > 0;
      
      if (newIsConnected !== this.isConnected) {
        console.log(`[ConnectionManager] Dashboard connection state changed from ${this.isConnected} to ${newIsConnected} (${connectedWorkflows.length}/${this.workflowConnectionStates.size} workflows connected)`);
        this.isConnected = newIsConnected;
      }
      
      // IMPORTANT: For dashboard routes, also populate connectionStates Map 
      // so UI components that depend on it can show the connected status
      if (ev.data.status === 'connected') {
        // Add a default connection state entry for step 0 to indicate global connection
        this.connectionStates.set(0, {
          status: 'connected',
          stepIndex: 0,
          lastActivity: new Date()
        });
        console.log(`[ConnectionManager] Added dashboard connection state for step 0 (${ev.workflowId})`);
      } else if (ev.data.status === 'disconnected') {
        // Remove connection state when disconnected
        this.connectionStates.delete(0);
        console.log(`[ConnectionManager] Removed dashboard connection state for step 0 (${ev.workflowId})`);
      }
      
      console.log(`[ConnectionManager] Connection change for workflowId "${ev.workflowId}" - status: ${ev.data.status}, global connected: ${this.isConnected}, connectionStates size: ${this.connectionStates.size}`);
      return;
    }
    
    // Ensure agents are loaded
    const agents = await this.agentManager.getAgentsForCurrentModule();
    
    // Find all steps that use this workflowType and update their connection states
    const matchingSteps: number[] = [];
    steps.forEach((step, index) => {
      if (!step.botId) return;
      const agent = agents.find((a: Agent) => a.id === step.botId);
      if (agent?.workflowType === ev.workflowId) {
        matchingSteps.push(index);
      }
    });
    
    console.log(`[ConnectionManager] Connection change for workflowId "${ev.workflowId}", updating ${matchingSteps.length} steps: [${matchingSteps.join(', ')}]`);
    
    // Update connection state for all matching steps
    matchingSteps.forEach(stepIndex => {
      this.connectionStates.set(stepIndex, { ...ev.data, stepIndex });
    });
    
    // Update global connection state
    const newConnected = Array.from(this.connectionStates.values()).some(state => state.status === 'connected');
    if (newConnected !== this.isConnected) {
      console.log(`[ConnectionManager] Connection state changed: ${newConnected}`);
      this.isConnected = newConnected;
    }
  }

  hasValidSettings(settings: Settings): boolean {
    return !!(settings.agentWebsocketUrl && 
              (settings.Authorization || settings.agentApiKey) && 
              settings.tenantId && 
              settings.participantId);
  }

  calculateSettingsHash(settings: Settings): string {
    const essentialSettings = {
      agentWebsocketUrl: settings.agentWebsocketUrl,
      Authorization: settings.Authorization || settings.agentApiKey,
      tenantId: settings.tenantId,
      participantId: settings.participantId
    };
    return JSON.stringify(essentialSettings);
  }

  cleanup(): void {
    this.connectionStates.clear();
    this.workflowConnectionStates.clear();
    this.isConnected = false;
    this.hubRef = null;
  }
} 