import React, { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuthActions } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, user } = useAuthActions();
  const location = useLocation();

  // Show loading spinner while authentication is being determined
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="textSecondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // If user is not authenticated, store the current location and redirect to login
  if (!isAuthenticated || !user) {
    // Store the attempted URL for redirect after login
    sessionStorage.setItem('returnUrl', location.pathname + location.search);
    return fallback || <>{children}</>;
    
    // return fallback || (
    //   <Box
    //     display="flex"
    //     flexDirection="column"
    //     alignItems="center"
    //     justifyContent="center"
    //     minHeight="50vh"
    //     gap={2}
    //     sx={{ textAlign: 'center', px: 3 }}
    //   >
    //     <Typography variant="h5" gutterBottom>
    //       Authentication Required
    //     </Typography>
    //     <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
    //       Please sign in to access this page.
    //     </Typography>
    //   </Box>
    // );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
