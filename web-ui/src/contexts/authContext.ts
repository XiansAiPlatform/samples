import { createContext } from 'react';
import { type AuthContextProps } from 'react-oidc-context';

// Create a custom auth context that wraps the OIDC context
export const AuthContext = createContext<AuthContextProps | null>(null);
