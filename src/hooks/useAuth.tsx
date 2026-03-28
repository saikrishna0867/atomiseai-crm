import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPreviewBypass: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewBypass, setIsPreviewBypass] = useState(() => {
    return localStorage.getItem('atomise_preview_mode') === 'true';
  });

  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch(() => setLoading(false));

      return () => subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Clear preview bypass on real login
    localStorage.removeItem('atomise_preview_mode');
    setIsPreviewBypass(false);
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    if (error) throw error;
  };

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signout errors
    }
    // Also clear preview mode
    localStorage.removeItem('atomise_preview_mode');
    setIsPreviewBypass(false);
    setUser(null);
    setSession(null);
  }, []);

  const enterPreviewMode = useCallback(() => {
    localStorage.setItem('atomise_preview_mode', 'true');
    setIsPreviewBypass(true);
  }, []);

  const exitPreviewMode = useCallback(() => {
    localStorage.removeItem('atomise_preview_mode');
    setIsPreviewBypass(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isPreviewBypass, signIn, signUp, signOut, enterPreviewMode, exitPreviewMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
