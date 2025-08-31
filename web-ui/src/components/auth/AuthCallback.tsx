import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuthActions } from '../../hooks/useAuth';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAuthActions();

  useEffect(() => {
    // react-oidc-context handles the callback automatically
    // We just need to redirect once authentication is complete
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to the home page or the page the user was trying to access
        const returnUrl = sessionStorage.getItem('returnUrl') || '/';
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else if (error) {
        console.error('Authentication callback error:', error);
        navigate('/?auth=error');
      }
    }
  }, [isAuthenticated, isLoading, error, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="textSecondary">
        Completing sign in...
      </Typography>
    </Box>
  );
};

export default AuthCallback;
