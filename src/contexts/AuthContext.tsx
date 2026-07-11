import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  getAuth,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user:    User | null;
  loading: boolean;
  error:   string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    // Listen to auth state — handles token refresh automatically
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        setError('');
      },
      (err) => {
        console.error('[Auth] onAuthStateChanged error:', err);
        setError('Authentication error. Please reload the page.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('[Auth] signOut error:', err);
      // Force clear local state even if signOut fails
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
