'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/utils/supabase-client';
import { User } from '@supabase/supabase-js';

export default function UserAuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const supabase = await getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Set up auth state change listener
    const setupAuthListener = async () => {
      const supabase = await getSupabaseBrowserClient();
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );

      // Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupAuthListener();
    return () => {
      cleanup.then(fn => fn());
    };
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-20 bg-accent/30 animate-pulse rounded"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end text-sm">
          <span className="font-medium truncate max-w-[120px]">
            {user.user_metadata?.preferred_username || 'User'}
          </span>
          <Link 
            href="/logout" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </Link>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {user.user_metadata?.preferred_username?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Sign In
    </Link>
  );
}
