import type { User } from 'oidc-client-ts';

/**
 * Extract the JWT ID token from the OIDC user object
 * The ID token is a proper JWT that can be used for authentication
 * @param user - The OIDC user object from react-oidc-context
 * @returns The JWT ID token or undefined
 */
export const extractJwtIdToken = (user: User | null | undefined): string | undefined => {
  if (!user) {
    console.log('[authUtils] No user object provided');
    return undefined;
  }

  // Log all available properties for debugging
  console.log('[authUtils] User object properties:', Object.keys(user));
  
  // The ID token is the JWT token we want for authentication
  if (user.id_token) {
    console.log('[authUtils] Found id_token:', user.id_token.substring(0, 30) + '...');
    
    // Verify it's a JWT (should have 3 parts separated by dots)
    if (isJwtToken(user.id_token)) {
      console.log('[authUtils] ✅ Found valid JWT ID token');
      return user.id_token;
    } else {
      console.log('[authUtils] ⚠️ id_token does not appear to be a valid JWT');
    }
  }

  // Also check access_token in case it's actually a JWT
  if (user.access_token && isJwtToken(user.access_token)) {
    console.log('[authUtils] ✅ Found JWT in access_token field');
    return user.access_token;
  }

  // Check other possible JWT token properties
  const tokenProperties = ['token', 'jwt', 'jwtToken', 'idToken'];
  for (const prop of tokenProperties) {
    const token = (user as unknown as Record<string, unknown>)[prop];
    if (token && typeof token === 'string' && isJwtToken(token)) {
      console.log(`[authUtils] ✅ Found JWT token in ${prop}`);
      return token;
    }
  }

  console.log('[authUtils] ❌ No JWT token found');
  return undefined;
};

/**
 * Check if a token appears to be a Google OAuth access token
 * @param token - The token to check
 * @returns True if the token appears to be a Google OAuth access token
 */
export const isGoogleAccessToken = (token: string): boolean => {
  return token.startsWith('ya29.');
};

/**
 * Check if a token appears to be a JWT (ID token)
 * @param token - The token to check
 * @returns True if the token appears to be a JWT
 */
export const isJwtToken = (token: string): boolean => {
  return token.split('.').length === 3;
};
