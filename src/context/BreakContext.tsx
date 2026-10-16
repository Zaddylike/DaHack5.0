import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { loadSessions, startBreak, stopBreak } from '../api';
import type { BreakSession } from '../domain';
import { useAuth } from './AuthContext';
import { getGrowth } from '../lib/growth';
import { getStatistics } from '../lib/statistics';
import { getAchievements } from '../lib/achievements';
export function useBreakData() {
  const { user } = useAuth(); const [sessions, setSessions] = useState<BreakSession[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const locked = useRef(false);
  const refresh = useCallback(async () => { const data = await loadSessions(); setSessions(data); }, []);
  useEffect(() => { let alive = true; setSessions([]); setLoading(true); if (user) loadSessions().then(data => { if (alive) setSessions(data); }).catch(e => { if (alive) setError(String(e.message)); }).finally(() => { if (alive) setLoading(false); }); else setLoading(false); return () => { alive = false; }; }, [user?.id]);
  useEffect(() => { const sync = () => { refresh().then(() => setError('')).catch(e => setError(e.message)); }; window.addEventListener('focus', sync); const timer = window.setInterval(sync, 15000); return () => { window.removeEventListener('focus', sync); clearInterval(timer); }; }, [refresh]);
  const activeSession = sessions.find(s => !s.ended_at) ?? null;
  async function perform(action: () => Promise<void>) {
    if (locked.current) return; locked.current = true; setBusy(true); setError('');
    try { await action(); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : '操作失敗，請重試'); } finally { locked.current = false; setBusy(false); }
  }
  const statistics = getStatistics(sessions);
  return { sessions, activeSession, statistics, growth: getGrowth(statistics.totalBreakSeconds), achievements: getAchievements(statistics), flowersCollected: statistics.totalBreakSeconds >= 12600 ? 1 : 0, busy, loading, error,
    start: () => perform(startBreak), stop: () => activeSession ? perform(() => stopBreak(activeSession.id)) : Promise.resolve(), retry: () => perform(refresh) };
}
type BreakData = ReturnType<typeof useBreakData>;
const BreakContext = createContext<BreakData | null>(null);
export function BreakProvider({ children }: { children: ReactNode }) { const value = useBreakData(); return <BreakContext.Provider value={value}>{children}</BreakContext.Provider>; }
export function useBreak() { const context = useContext(BreakContext); if (!context) throw new Error('BreakProvider required'); return context; }
