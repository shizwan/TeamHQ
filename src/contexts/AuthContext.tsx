'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Dummy user for now until NextAuth is set up
const dummyUser = {
  uid: 'demo-user',
  email: 'admin@cynohq.com',
  displayName: 'Admin User',
};

interface AuthContextValue {
  user: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    // Simulate auth check
    const checkAuth = () => {
      const isAuth = localStorage.getItem('auth_token');
      if (isAuth) setUser(dummyUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const signInWithGoogle = async () => {
    localStorage.setItem('auth_token', 'true');
    setUser(dummyUser);
  };
  const signInWithEmail = async () => {
    localStorage.setItem('auth_token', 'true');
    setUser(dummyUser);
  };
  const signUpWithEmail = async () => {
    localStorage.setItem('auth_token', 'true');
    setUser(dummyUser);
  };
  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
