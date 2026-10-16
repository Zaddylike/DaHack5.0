import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api';

async function allowedUser(user: User | null): Promise<User | null> {
  if (!user || !supabase) return null;
  const { data, error } = await supabase.rpc('is_demo_user');
  if (error) throw error;
  return data === true ? user : null;
}

export const authService = {
  async login(email: string, password: string) {
    if (!supabase) throw new Error('Supabase 尚未設定');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    try {
      if (!(await allowedUser(data.user))) {
        await supabase.auth.signOut();
        throw new Error('此帳號不在五個 Demo 帳號名單內');
      }
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  },
  async logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  async getCurrentUser() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return allowedUser(data.user);
  },
};

export const AuthContext = createContext<{ user: User | null; loading: boolean; error: string }>({ user: null, loading: true, error: '' });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    let revision = 0;
    async function applySession(session: Session | null, currentRevision: number) {
      try {
        const next = await allowedUser(session?.user ?? null);
        if (!alive || revision !== currentRevision) return;
        if (session?.user && !next) {
          await supabase!.auth.signOut();
          if (!alive || revision !== currentRevision) return;
          setError('此帳號不在五個 Demo 帳號名單內');
        } else setError('');
        setUser(next);
      } catch (reason) {
        if (alive && revision === currentRevision) {
          setUser(null);
          setError(reason instanceof Error ? reason.message : '無法確認 Demo 帳號');
        }
      } finally {
        if (alive && revision === currentRevision) setLoading(false);
      }
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentRevision = ++revision;
      setLoading(true);
      // Supabase recommends running additional client calls outside the auth callback.
      queueMicrotask(() => { void applySession(session, currentRevision); });
    });
    const initialRevision = revision;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || revision !== initialRevision) return;
      if (error) { setError(error.message); setLoading(false); return; }
      void applySession(data.session, initialRevision);
    }).catch(reason => {
      if (alive && revision === initialRevision) { setError(String(reason)); setLoading(false); }
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ user, loading, error }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
