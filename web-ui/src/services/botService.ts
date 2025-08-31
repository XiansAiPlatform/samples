// Bot Service - Wrapper around Socket SDK for bot subscriptions and chat functionality
import { SocketSDK } from '@99xio/xians-sdk-typescript';
import { MessageType } from '@99xio/xians-sdk-typescript';
import type { Message, EventHandlers } from '@99xio/xians-sdk-typescript';
import { getSDKConfig } from '../config/sdk';
import type { Bot, ChatMessage } from '../types';
import { getCurrentBotGlobal } from '../utils/agentUtils';
import { getCurrentDocumentIdGlobal } from '../utils/documentUtils';

export interface BotServiceOptions {
  onMessageReceived?: (message: ChatMessage) => void;
  onConnectionStateChanged?: (connected: boolean) => void;
  onError?: (error: string) => void;
  onDataMessageReceived?: (message: Message) => void;
  onChatRequestSent?: (requestId: string) => void;
  onChatResponseReceived?: (requestId: string) => void;
  participantId?: string;
  jwtToken?: string; // JWT token for authenticated users
}

export class BotService {
  private socketSDK: SocketSDK;
  private options: BotServiceOptions;
  private messageCounter = 0;
  private isLoadingHistory = false;
  private processedHistoryHashes = new Set<string>();
  private historyLoadedForAgent: string | null = null;
  private historyLoadedForDocument: string | null = null;

  // Expose current bot for external checks (read-only)
  getCurrentBot(): Bot | null {
    return getCurrentBotGlobal();
  }

  // Get current document ID directly from URL
  getCurrentDocumentId(): string | undefined {
    return getCurrentDocumentIdGlobal() || undefined;
  }

  constructor(options: BotServiceOptions = {}) {
    this.options = options;    
    const config = getSDKConfig(options.jwtToken);
    
    const eventHandlers: EventHandlers = {
      onReceiveChat: this.handleChatMessage.bind(this),
      onReceiveData: this.handleDataMessage.bind(this),
      onReceiveHandoff: this.handleHandoffMessage.bind(this),
      onThreadHistory: this.handleThreadHistory.bind(this),
      onConnected: this.handleConnected.bind(this),
      onDisconnected: this.handleDisconnected.bind(this),
      onConnectionError: this.handleConnectionError.bind(this),
      onError: this.handleError.bind(this),
    };

    // Create SocketSDK configuration - include jwtToken if available
    const socketConfig: Record<string, unknown> = {
      tenantId: config.tenantId,
      apiKey: config.apiKey,
      serverUrl: config.serverUrl,
      autoReconnect: true,
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      eventHandlers,
      logger: (message: string) => console.log(`[BotService] ${message}`),
    };

    // Add JWT token if provided for authenticated users
    if (config.jwtToken) {
      socketConfig.jwtToken = config.jwtToken;
      console.log('[BotService] Initializing with JWT token for authenticated user');
    }

    try {
      this.socketSDK = new SocketSDK(socketConfig as unknown as ConstructorParameters<typeof SocketSDK>[0]);
    } catch (error) {
      console.error('[BotService] Failed to initialize SocketSDK:', error);
      // Handle the case where neither apiKey nor jwtToken is available
      if (!config.apiKey && !config.jwtToken) {
        console.warn('[BotService] Neither API key nor JWT token available. User needs to authenticate.');
        // Create a minimal socket SDK that will fail gracefully
        this.socketSDK = null as unknown as SocketSDK;
        // Notify the error handler
        if (this.options.onError) {
          this.options.onError('Authentication required. Please sign in to continue.');
        }
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }

  async connect(): Promise<void> {
    console.log('[BotService] Attempting to connect...');
    if (!this.socketSDK) {
      throw new Error('SocketSDK not initialized. Authentication required.');
    }
    await this.socketSDK.connect();
    
    // Manually check connection state since onConnected might not be called
    setTimeout(() => {
      if (this.socketSDK) {
        const isConnected = this.socketSDK.isConnected();
        console.log('[BotService] Manual connection check:', isConnected);
        if (isConnected) {
          this.handleConnected();
        }
      }
    }, 1000); // Give it a moment to establish connection
  }

  async disconnect(): Promise<void> {
    if (!this.socketSDK) {
      console.warn('[BotService] SocketSDK not initialized, cannot disconnect');
      return;
    }
    await this.socketSDK.disconnect();
  }

  isConnected(): boolean {
    if (!this.socketSDK) {
      return false;
    }
    return this.socketSDK.isConnected();
  }

  async subscribeToCurrentAgent(): Promise<void> {
    const bot = getCurrentBotGlobal();
    if (!bot) {
      console.log(`[BotService] No current bot available`);
      return;
    }

    // Skip if already subscribed to this bot and document
    if (this.historyLoadedForAgent === bot.workflow) {
      console.log(`[BotService] Already subscribed to ${bot.name}`);
      return;
    }

    // Unsubscribe from previous bot if different
    if (this.historyLoadedForAgent && this.isConnected()) {
      console.log(`[BotService] Unsubscribing from previous bot`);
      if (this.socketSDK) {
        await this.socketSDK.unsubscribeFromAgent(
          this.historyLoadedForAgent,
          this.getParticipantId()
        );
      }
    }

    // Reset state for new subscription
    this.processedHistoryHashes.clear();
    this.isLoadingHistory = false;
    this.historyLoadedForAgent = null;
    this.historyLoadedForDocument = null;

    // Subscribe to current bot
    if (this.isConnected()) {
      console.log(`[BotService] Subscribing to ${bot.name}`);
      
      try {
        if (this.socketSDK) {
          await this.socketSDK.subscribeToAgent(
            bot.workflow,
            this.getParticipantId()
          );
        }
        console.log(`✅ [BotService] Subscribed to ${bot.workflow}`);
        
        // Load conversation history
        await this.loadConversationHistory(bot);
      } catch (error) {
        console.error(`❌ [BotService] Failed to subscribe to ${bot.name}`, error);
        throw error;
      }
    }
  }

  private async loadConversationHistory(bot: Bot): Promise<void> {
    const currentDocumentId = this.getCurrentDocumentId();
    const botWorkflow = bot.workflow;
    
    // Check if we already loaded history for this bot and document combination
    if (this.historyLoadedForAgent === botWorkflow && 
        this.historyLoadedForDocument === currentDocumentId && 
        !this.isLoadingHistory) {
      console.log(`[BotService] History already loaded for ${bot.name} and document ${currentDocumentId}`);
      return;
    }
    
    // Check if already loading to prevent duplicate requests
    if (this.isLoadingHistory) {
      console.log(`[BotService] History loading already in progress for ${bot.name}`);
      return;
    }

    try {
      this.isLoadingHistory = true;
      console.log(`[BotService] Loading history for ${bot.name}, document: ${currentDocumentId}`);
      
      if (this.socketSDK) {
        await this.socketSDK.getThreadHistory(
          botWorkflow,
          this.getParticipantId(),
          1,
        20,
        currentDocumentId
        );
      }
      
      this.historyLoadedForAgent = botWorkflow;
      this.historyLoadedForDocument = currentDocumentId || null;
      console.log(`[BotService] ✅ History loaded for ${bot.name}, document: ${currentDocumentId}`);
    } catch (error) {
      console.error(`[BotService] Failed to load history for ${bot.name}:`, error);
      this.options.onError?.('Failed to load conversation history');
    } finally {
      this.isLoadingHistory = false;
    }
  }

  async sendMessage(text: string): Promise<void> {
    const currentBot = getCurrentBotGlobal();
    if (!currentBot) {
      throw new Error('No bot selected');
    }

    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    const requestId = `msg-${Date.now()}-${++this.messageCounter}`;
    const message = {
      requestId,
      participantId: this.getParticipantId(),
      workflow: currentBot.workflow,
      type: 'Chat' as const,
      scope: this.getCurrentDocumentId(),
      text,
      data: this.getMessageData(),
    };

    // Notify that a chat request was sent
    this.options.onChatRequestSent?.(requestId);

    if (!this.socketSDK) {
      throw new Error('SocketSDK not initialized. Authentication required.');
    }
    await this.socketSDK.sendInboundMessage(message, MessageType.Chat);
  }

  async sendData(data: Record<string, unknown>): Promise<void> {
    const currentBot = getCurrentBotGlobal();
    if (!currentBot) {
      throw new Error('No bot selected');
    }

    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    const message = {
      requestId: `data-${Date.now()}-${++this.messageCounter}`,
      participantId: this.getParticipantId(),
      workflow: currentBot.workflow,
      type: 'Data' as const,
      scope: this.getCurrentDocumentId(),
      data: {
        ...data,
        ...this.getMessageData(),
      },
    };

    if (!this.socketSDK) {
      throw new Error('SocketSDK not initialized. Authentication required.');
    }
    await this.socketSDK.sendInboundMessage(message, MessageType.Data);
  }

  private getParticipantId(): string {
    return this.options.participantId || getSDKConfig().participantId;
  }

  private getMessageData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    
    const documentId = this.getCurrentDocumentId();
    if (documentId) {
      data.documentId = documentId;
    }
    return data;
  }

  private handleChatMessage(message: Message): void {
    const currentDocumentId = this.getCurrentDocumentId();
    if(message.scope !== currentDocumentId) {
      return;
    }
    
    // Check if this is a Chat response with a requestId
    if (message.requestId && message.messageType === 'Chat') {
      this.options.onChatResponseReceived?.(message.requestId);
    }
    
    const chatMessage = this.convertToChatMessage(message, 'agent');
    if (chatMessage.content) {
      this.options.onMessageReceived?.(chatMessage);
    }
  }

  private handleDataMessage(message: Message): void {
    const currentDocumentId = this.getCurrentDocumentId();
    if(message.scope !== currentDocumentId) {
      return;
    }
    
    this.options.onDataMessageReceived?.(message);
  }

  private handleHandoffMessage(message: Message): void {
    const displayText = message.text || 'Handoff request processed';
    const chatMessage = this.convertToChatMessage(
      { ...message, text: displayText }, 
      'agent'
    );
    this.options.onMessageReceived?.(chatMessage);
  }

  private handleThreadHistory(history: Message[]): void {
    if (history.length === 0) return;

    // Prevent duplicate processing
    const historyHash = history.map(m => m.id).sort().join(',');
    if (this.processedHistoryHashes.has(historyHash)) {
      return;
    }
    this.processedHistoryHashes.add(historyHash);
    
    // Filter out Data messages and sort chronologically
    const chatHistory = history
      .filter(message => message.messageType !== MessageType.Data)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

    // Send history messages to UI
    chatHistory.forEach((message, index) => {
      const sender = message.direction === 'Incoming' ? 'user' : 'agent';
      const chatMessage = this.convertToChatMessage(message, sender);
      chatMessage.metadata = {
        ...chatMessage.metadata,
        isHistoryMessage: true
      };
      
      // Small delay to prevent UI flooding
      setTimeout(() => {
        this.options.onMessageReceived?.(chatMessage);
      }, index * 10);
    });
  }

  private convertToChatMessage(message: Message, sender: 'user' | 'agent'): ChatMessage {
    return {
      id: message.id || `msg-${Date.now()}-${Math.random()}`,
      content: message.text || '',
      sender,
      timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
      type: 'text',
      metadata: {
        socketMessage: message,
        workflow: message.workflowType,
      },
    };
  }

  private handleConnected(): void {
    console.log('[BotService] ✅ Connected to server');
    this.options.onConnectionStateChanged?.(true);
  }

  private handleDisconnected(reason?: string): void {
    console.log(`[BotService] ❌ Disconnected: ${reason}`);
    this.options.onConnectionStateChanged?.(false);
  }

  private handleConnectionError(error: { statusCode: number; message: string }): void {
    console.error('[BotService] 🚨 Connection error:', error);
    this.options.onError?.(`Connection error: ${error.message}`);
  }

  private handleError(error: string): void {
    console.error('[BotService] 🚨 Error:', error);
    this.options.onError?.(error);
  }

  async dispose(): Promise<void> {
    // Reset any loading state
    this.isLoadingHistory = false;
    this.processedHistoryHashes.clear();
    this.historyLoadedForAgent = null;
    
    if (this.socketSDK) {
      await this.socketSDK.dispose();
    }
  }
}