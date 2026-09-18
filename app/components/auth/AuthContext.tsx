"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clearCache } from '@/lib/cache';
import { signOutEverywhere } from './signOutEverywhere';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: authSession, status: authStatus } = useSession();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data) => {
        if (authStatus !== 'authenticated') setUser(data.user ?? null);
      })
      .catch(() => {
        if (authStatus !== 'authenticated') setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [authStatus]);

  useEffect(() => {
    if (authSession?.user) {
      clearCache();
      setUser(authSession.user);
      setIsLoading(false);
    }
  }, [authSession]);

  const login = (userData) => {
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = async () => {
    await signOutEverywhere();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isLoading || authStatus === 'loading',
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
