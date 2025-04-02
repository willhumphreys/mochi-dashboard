// src/AuthContext.tsx
import { Amplify } from 'aws-amplify';
import { signOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import amplifyConfig from './config/amplify-config';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithRedirect } from 'aws-amplify/auth';


// Initialize Amplify with your configuration
Amplify.configure(amplifyConfig);

// Define a type for the user based on what getCurrentUser returns
type AuthUser = {
  username: string;
  userId: string;
  attributes?: Record<string, unknown>;
} | null;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  signIn: () => {},
  signOut: () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    // Check current authentication status on component mount
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      // Using the new API
      const authSession = await fetchAuthSession();
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(authSession.tokens !== undefined);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    // Using the new API for federated sign-in
    signInWithRedirect();

  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    signIn: handleSignIn,
    signOut: handleSignOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};