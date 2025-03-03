"use client";

import { useEffect, useState } from 'react';
import { AuthProvider as ContextProvider } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This ensures Supabase auth is initialized on the client side
    const initializeSupabase = async () => {
      await supabase.auth.getSession();
      setIsInitialized(true);
    };
    
    initializeSupabase();
  }, []);

  if (!isInitialized) {
    // You could show a loading spinner here if needed
    return null;
  }

  return <ContextProvider>{children}</ContextProvider>;
}
