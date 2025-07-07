import { ConnectionState } from '../../types';
import AgentSDK from '@99xio/xians-sdk-typescript';
import { Settings, Step, Agent } from './types';
import { AgentManager } from './AgentManager';

export class ConnectionManager {
  private connectionStates = new Map<number, ConnectionState>();
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
    return sdk;
  }

  async handleConnectionChange(ev: { workflowId: string; data: ConnectionState }, steps: Step[], hasSteps: boolean): Promise<void> {
    // If no steps available (dashboard route), still update global connection state
    if (!hasSteps || steps.length === 0) {
      console.log(`[ConnectionManager] Connection change for workflowId "${ev.workflowId}" (no steps to update)`);
      this.isConnected = ev.data.status === 'connected';
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
    this.isConnected = false;
    this.hubRef = null;
  }
} 