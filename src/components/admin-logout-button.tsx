"use client";

import { useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/auth-context';

export default function AdminLogoutButton() {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <FiLogOut className="h-4 w-4" />
      <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
    </button>
  );
}
