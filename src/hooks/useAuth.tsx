import React, { useEffect, useState, useContext, useCallback, forwardRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/hooks/auth-context';

export const AuthProvider = forwardRef<HTMLDivElement, { children: React.ReactNode }>(function AuthProvider({ children }, _ref) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewBypass, setIsPreviewBypass] = useState(() => {
    return localStorage.getItem('atomise_preview_mode') === 'true';
  });

  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      });

      supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
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
});

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
