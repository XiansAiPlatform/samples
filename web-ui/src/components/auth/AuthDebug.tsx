import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useAuthActions } from '../../hooks/useAuth';
import { extractJwtIdToken, isJwtToken, isGoogleAccessToken } from '../../utils/authUtils';

/**
 * Debug component to inspect the authentication state and user object
 * This component helps verify what tokens and properties are available
 */
const AuthDebug: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuthActions();

  const handleLogUserObject = () => {
    console.log('=== AUTH DEBUG ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user object:', user);
    if (user) {
      console.log('user properties:', Object.keys(user));
      console.log('access_token:', user.access_token);
      console.log('id_token:', user.id_token);
      console.log('token_type:', user.token_type);
      console.log('expires_at:', user.expires_at);
      console.log('scope:', user.scope);
      
      // Token analysis
      if (user.access_token) {
        console.log('access_token is Google OAuth token:', isGoogleAccessToken(user.access_token));
        console.log('access_token is JWT:', isJwtToken(user.access_token));
      }
      if (user.id_token) {
        console.log('id_token is JWT:', isJwtToken(user.id_token));
      }
      
      const jwtToken = extractJwtIdToken(user);
      console.log('extracted JWT token:', jwtToken ? jwtToken.substring(0, 50) + '...' : 'none');
    }
    console.log('==================');
  };

  return (
    <Box p={2}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Authentication Debug
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </Typography>
        
        {user && (
          <>
            <Typography variant="body2" gutterBottom>
              User Properties: {Object.keys(user).join(', ')}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              Access Token (OAuth): {user.access_token ? `${user.access_token.substring(0, 30)}... (${isGoogleAccessToken(user.access_token) ? 'Google OAuth' : 'Other'})` : 'Not available'}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              ID Token (JWT): {user.id_token ? `${user.id_token.substring(0, 50)}... (${isJwtToken(user.id_token) ? 'Valid JWT' : 'Invalid JWT'})` : 'Not available'}
            </Typography>
            
            <Typography variant="body2" gutterBottom color="primary">
              Using JWT Token: {extractJwtIdToken(user) ? `${extractJwtIdToken(user)!.substring(0, 50)}...` : 'Not available'}
            </Typography>
          </>
        )}
        
        <Box mt={2} gap={1} display="flex">
          {!isAuthenticated ? (
            <Button variant="contained" onClick={login}>
              Sign In
            </Button>
          ) : (
            <Button variant="outlined" onClick={logout}>
              Sign Out
            </Button>
          )}
          
          <Button variant="outlined" onClick={handleLogUserObject}>
            Log User Object
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthDebug;
