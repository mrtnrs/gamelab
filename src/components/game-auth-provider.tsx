"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Create context
const GameAuthContext = createContext<{
  isAuthenticated: boolean;
  xHandle: string | null;
  xId: string | null;
}>({
  isAuthenticated: false,
  xHandle: null,
  xId: null,
});

// Provider component
export default function GameAuthProvider({ children }: { children: ReactNode }) {
  // Since this is a client component, we can't use cookies() directly
  // We'll pass the authentication state through props or use a client-side approach
  
  // For now, we'll just render the children
  return (
    <GameAuthContext.Provider value={{ 
      isAuthenticated: false, 
      xHandle: null, 
      xId: null 
    }}>
      {children}
    </GameAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useGameAuth = () => useContext(GameAuthContext);