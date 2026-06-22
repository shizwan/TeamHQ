'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
      const savedUser = sessionStorage.getItem('cynohq_demo_user');
      if (savedUser) {
        setTimeout(() => {
          if (active) setUser(JSON.parse(savedUser));
        }, 0);
      }
      setTimeout(() => {
        if (active) setLoading(false);
      }, 0);
      return () => { active = false; };
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const setDemoUser = (email: string) => {
    const fakeUser = { email, uid: 'demo-user', emailVerified: true } as User;
    sessionStorage.setItem('cynohq_demo_user', JSON.stringify(fakeUser));
    setUser(fakeUser);
  };

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
      setDemoUser('demo@cynohq.com');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setError(getAuthErrorMessage(code));
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
      setDemoUser(email);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setError(getAuthErrorMessage(code));
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
      setDemoUser(email);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setError(getAuthErrorMessage(code));
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
      sessionStorage.removeItem('cynohq_demo_user');
      setUser(null);
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setError(getAuthErrorMessage(code));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
