import { useCallback } from 'react';
import { flowRestService, type RestConverseResponse } from '../services/flowRestService';
import { useAuthActions } from './useAuth';
import { extractJwtIdToken } from '../utils/authUtils';

/**
 * Custom hook that provides an authenticated REST service client
 * Automatically includes JWT token from authenticated user
 */
export const useFlowRestService = () => {
  const { isAuthenticated, user } = useAuthActions();

  const callRPC = useCallback(
    async (methodName: string, data: object): Promise<RestConverseResponse> => {
      // Get JWT ID token from authenticated user
      const jwtToken = isAuthenticated ? extractJwtIdToken(user) : undefined;
      
      if (jwtToken) {
        console.log('[useFlowRestService] Making authenticated REST call with JWT token:', jwtToken.substring(0, 50) + '...');
      } else {
        console.log('[useFlowRestService] Making unauthenticated REST call');
      }

      return flowRestService.callRPC(methodName, data, jwtToken);
    },
    [isAuthenticated, user?.id_token]
  );

  return {
    callRPC,
    isAuthenticated,
  };
};
