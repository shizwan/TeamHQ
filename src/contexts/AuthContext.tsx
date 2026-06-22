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
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const checkAuth = () => {
      const isAuth = localStorage.getItem('auth_token');
      if (isAuth) setUser(dummyUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const loginWithGoogle = async () => {
    localStorage.setItem('auth_token', 'true');
    setUser(dummyUser);
  };
  const loginWithEmail = async () => {
    localStorage.setItem('auth_token', 'true');
    setUser(dummyUser);
  };
  const registerWithEmail = async () => {
    localStorage.setItem('auth_token', 'true');
    setUser(dummyUser);
  };
  const logout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
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
