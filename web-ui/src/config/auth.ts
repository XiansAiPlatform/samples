import { type UserManagerSettings } from 'oidc-client-ts';

// Google OIDC Configuration - Google requires client_secret even with PKCE
export const oidcConfig: UserManagerSettings = {
  authority: 'https://accounts.google.com',
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '', // Google requires this even for public clients
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: 'code',
  scope: 'openid profile email',
  
  // PKCE settings (Google still requires client_secret unfortunately)
  response_mode: 'query',
  disablePKCE: false, // Keep PKCE enabled for additional security
  
  // Additional settings for better UX
  automaticSilentRenew: false, // Disable for now to avoid issues
  includeIdTokenInSilentRenew: false,
  loadUserInfo: true,
  
  // Silent renew settings
  silent_redirect_uri: `${window.location.origin}/auth/silent-callback`,
  
  // Google-specific settings
  filterProtocolClaims: true,
  
  // Updated metadata for current Google OIDC endpoints (no Google+ dependency)
  metadata: {
    issuer: 'https://accounts.google.com',
    authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    token_endpoint: 'https://oauth2.googleapis.com/token',
    userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    end_session_endpoint: 'https://accounts.google.com/logout',
    revocation_endpoint: 'https://oauth2.googleapis.com/revoke',
    
    // Enable PKCE support
    code_challenge_methods_supported: ['S256'],
  },
};

// Validate required environment variables
if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set. Please configure Google OAuth credentials.');
}
