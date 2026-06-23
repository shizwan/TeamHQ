'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Dummy user for now until NextAuth is set up
const dummyUser = {
  uid: 'admin-user',
  email: 'admin@teamhq.com',
  displayName: 'Admin User',
};

interface AuthContextValue {
  user: any;
  loading: boolean;
  signInWithEmail: (e: string, p: string) => Promise<void>;
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

  const signInWithEmail = async (email: string, pass: string) => {
    if (email === 'admin@teamhq.com' && pass === 'password') {
      localStorage.setItem('auth_token', 'true');
      setUser(dummyUser);
    } else {
      setError('Invalid email or password');
      throw new Error('Invalid email or password');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signOut, error, clearError }}>
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
