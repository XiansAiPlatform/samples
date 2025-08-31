import React, { type ReactNode } from 'react';
import { AuthProvider as OidcAuthProvider, useAuth } from 'react-oidc-context';
import { oidcConfig } from '../config/auth';
import { AuthContext } from '../contexts/authContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <OidcAuthProvider {...oidcConfig}>
      <AuthContextConsumer>
        {children}
      </AuthContextConsumer>
    </OidcAuthProvider>
  );
};

// This component provides the auth context to children
const AuthContextConsumer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};


