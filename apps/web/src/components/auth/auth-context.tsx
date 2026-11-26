'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as auth from '@/lib/auth';
import type { User } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName?: string; organizationName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const refreshed = await auth.refresh();
      if (refreshed?.user) { setUser(refreshed.user); return; }
      setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  const login = async (email: string, password: string) => {
    const res = await auth.login({ email, password });
    setUser(res.user);
  };

  const register = async (input: { email: string; password: string; firstName: string; lastName?: string; organizationName?: string }) => {
    const res = await auth.register(input);
    setUser(res.user);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
