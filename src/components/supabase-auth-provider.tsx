'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/utils/supabase-client';
import { Session, User } from '@supabase/supabase-js';
import { signOut } from '@/actions/supabase-auth-actions';

// Define the context type
type SupabaseAuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<{ success: boolean }>;
  refreshSession: () => Promise<void>;
};

// Create the context with default values
const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => ({ success: false }),
  refreshSession: async () => {},
});

// Provider component
export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to refresh the session
  const refreshSession = async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        setUser(null);
        setSession(null);
      }
      return result;
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false };
    }
  };
  
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    // Get the initial session
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        const supabase = await getSupabaseBrowserClient();
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        // Set up auth state change listener
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          setSession(session);
          setUser(session?.user || null);
          setIsLoading(false);
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initialize
    initializeAuth();
    
    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);
  
  return (
    <SupabaseAuthContext.Provider 
      value={{ 
        user, 
        session, 
        isLoading, 
        signOut: handleSignOut,
        refreshSession
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
