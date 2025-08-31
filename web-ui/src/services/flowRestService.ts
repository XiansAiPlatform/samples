// Flow REST Service - HTTP client for making REST calls to flow endpoints
import { getSDKConfig } from '../config/sdk';
import { getCurrentFlowGlobal } from '../utils/agentUtils';

export interface RestConverseResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

export class FlowRestService {


  private getWorkflow(): string {
    // Get workflow from global context only
    const workflow = getCurrentFlowGlobal();
    if (!workflow) {
      throw new Error('No agent is currently selected. Please navigate to an agent page before making REST calls.');
    }
    return workflow;
  }

  /**
   * Make a REST API call to the converse endpoint
   * @param methodName - The RPC method name
   * @param data - The request data
   * @param jwtToken - Optional JWT token for authenticated requests
   * @returns Promise<RestConverseResponse>
   */
  async callRPC(methodName: string, data: object, jwtToken?: string): Promise<RestConverseResponse> {
    try {
      const config = getSDKConfig(jwtToken);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        workflow: this.getWorkflow(),
        tenantId: config.tenantId,
        type: 'Data',
        participantId: config.participantId,
        text: methodName,
      });

      if (config.apiKey) {
        queryParams.set('apikey', config.apiKey);
      }

      const url = `${config.serverUrl}/api/user/rest/converse?${queryParams.toString()}`;
      
      console.log(`[FlowRestService] Making POST request to: ${url}`);
      console.log(`[FlowRestService] Request body:`, data);
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if JWT token is provided
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
        console.log('[FlowRestService] Including JWT token in Authorization header');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[FlowRestService] Request failed:`, errorMessage, responseData);
        
        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
          data: responseData.response.data.data,
        };
      }

      console.log(`[FlowRestService] ✅ Request successful:`, responseData);
      return {
        success: true,
        data: responseData.response.data.data,
        statusCode: response.status,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[FlowRestService] 🚨 Request error:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Export a singleton instance for convenience
export const flowRestService = new FlowRestService();

