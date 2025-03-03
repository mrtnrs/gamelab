"use client";

import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  isAdmin: boolean;
  isLoading: boolean;
  adminLogin: (password: string) => Promise<{ success: boolean, error?: string }>;
  adminLogout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In a real app, you would use a more secure approach
  // This is a simplified version for static site deployment
  const ADMIN_PASSWORD = 'admin123'; // In production, use environment variables
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if admin status is stored in localStorage on component mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const storedAdminStatus = localStorage.getItem('gamelab_admin');
      if (storedAdminStatus === 'true') {
        setIsAdmin(true);
      }
    }
    setIsLoading(false);
  });

  const adminLogin = async (password: string) => {
    setIsLoading(true);
    
    // Simple password check - in a real app, use a secure API
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gamelab_admin', 'true');
      }
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, error: 'Invalid admin password' };
    }
  };

  const adminLogout = () => {
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gamelab_admin');
    }
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading, adminLogin, adminLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
