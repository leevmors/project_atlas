'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthSession } from '@/lib/types';
import { getSession, logout as apiLogout } from '@/lib/store';

interface AuthContextType {
  session: AuthSession;
  setSession: (session: AuthSession) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then((s) => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    await apiLogout().catch(() => {});
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
