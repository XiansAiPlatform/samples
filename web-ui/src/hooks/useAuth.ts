import { useContext } from 'react';
import { type AuthContextProps } from 'react-oidc-context';
import { AuthContext } from '../contexts/authContext';

// Custom hook to use auth context
export const useAuthContext = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Helper hook for common auth operations
export const useAuthActions = () => {
  const auth = useAuthContext();
  
  const login = () => {
    auth.signinRedirect();
  };

  const logout = () => {
    auth.signoutRedirect();
  };

  const isAuthenticated = !!auth.user && !auth.user.expired;

  return {
    login,
    logout,
    isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
  };
};
