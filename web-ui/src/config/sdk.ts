// Socket SDK Configuration
export interface SDKConfig {
  tenantId: string;
  apiKey: string;
  serverUrl: string;
  participantId: string;
  jwtToken?: string; // Optional JWT token for authenticated users
}

// Environment-based configuration
export const getSDKConfig = (jwtToken?: string): SDKConfig => {
  return {
    tenantId: import.meta.env.VITE_XIANSAI_TENANT_ID,
    apiKey: import.meta.env.VITE_XIANSAI_API_KEY,
    serverUrl: import.meta.env.VITE_XIANSAI_SERVER_URL,
    participantId: import.meta.env.VITE_XIANSAI_PARTICIPANT_ID,
    jwtToken, // Pass through the JWT token if provided
  };
};