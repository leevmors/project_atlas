'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthSession } from '@/lib/types';
import { getSession, logout as logoutStore } from '@/lib/store';

interface AuthContextType {
  session: AuthSession;
  setSession: (session: AuthSession) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = getSession();
    setSession(storedSession);
    setIsLoading(false);
  }, []);

  const logout = () => {
    logoutStore();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, setSession, logout, isLoading }}>
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
