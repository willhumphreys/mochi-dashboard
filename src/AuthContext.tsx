// src/AuthContext.tsx
import { Amplify } from 'aws-amplify';
import { signOut, fetchAuthSession, getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import amplifyConfig from './config/amplify-config';
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

// Initialize Amplify with your configuration
Amplify.configure(amplifyConfig);

// Define a type for the user based on what getCurrentUser returns
type AuthUser = {
  username: string;
  userId: string;
  attributes?: Record<string, unknown>; // Keep attributes optional as per potential return type
} | null;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser;
  signIn: () => void;
  signOut: () => Promise<void>; // Make signOut return a promise for potential async cleanup
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  signIn: () => {},
  signOut: async () => {} // Default async function
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
  // Create a ref to track loading state that won't have closure issues
  const isLoadingRef = useRef(true);

  // This single useEffect runs once on mount
  useEffect(() => {
    // Check current authentication status on component mount.
    // If the app is loading after a redirect from Cognito,
    // fetchAuthSession/getCurrentUser will implicitly handle the code exchange.
    const checkAuthState = async () => {
      try {
        console.log('Starting auth check...');
        setIsLoading(true); // Ensure loading is true at the start
        isLoadingRef.current = true;

        console.log('Fetching auth session...');
        // This call implicitly handles the redirect result if applicable
        const authSession = await fetchAuthSession();
        console.log('Auth session result:', authSession);

        // Check if tokens exist (indicating successful session)
        const authenticated = authSession.tokens !== undefined;
        setIsAuthenticated(authenticated);
        console.log('Authentication state set:', authenticated);

        if (authenticated) {
          console.log('Getting current user...');
          // getCurrentUser might also trigger handling, but fetchAuthSession is often sufficient
          const currentUser = await getCurrentUser();
          console.log('Current user result:', currentUser);
          setUser(currentUser);
        } else {
          // If not authenticated, ensure user state is null
          setUser(null);
        }

      } catch (error) {
        // An error here often means the user is not authenticated
        console.warn('Auth check error (likely indicates no session):', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false; // Update ref when loading completes
        console.log('Auth check completed, loading state set to false');
      }
    };

    checkAuthState();

    // Optional: Fallback timeout remains a reasonable safeguard
    const timeoutId = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('Auth check timeout - ending loading state only');
        setIsLoading(false);
        // Don't change authentication state on timeout
        // This allows UI to respond even if auth check is slow
      }
    }, 10000); // 10 seconds timeout

    return () => {
      clearTimeout(timeoutId);
      isLoadingRef.current = false; // Prevent timeout from executing during cleanup
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSignIn = () => {
    // Using the new API for federated sign-in
    // No need to await this, it navigates the user away
    signInWithRedirect();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Context value to provide to consumers
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    signIn: handleSignIn,
    signOut: handleSignOut
  };

  return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
  );
};

export default AuthContext;