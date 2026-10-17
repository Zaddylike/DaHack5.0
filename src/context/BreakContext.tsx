import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { claimSeeds, loadGardenState, loadSessions, plantSeed, startBreak, stopBreak } from '../api';
import { EMPTY_GARDEN, type BreakSession, type GardenState } from '../domain';
import { useAuth } from './AuthContext';
import { getGrowth } from '../lib/growth';
import { getStatistics } from '../lib/statistics';
import { getAchievements } from '../lib/achievements';
export function useBreakData() {
  const { user } = useAuth(); const [sessions, setSessions] = useState<BreakSession[]>([]); const [garden, setGarden] = useState<GardenState>(EMPTY_GARDEN); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const locked = useRef(false);
  const refresh = useCallback(async () => { const [data, nextGarden] = await Promise.all([loadSessions(), loadGardenState()]); setSessions(data); setGarden(nextGarden); }, []);
  useEffect(() => { let alive = true; setSessions([]); setGarden(EMPTY_GARDEN); setError(''); setLoading(true); if (user) Promise.all([loadSessions(), loadGardenState()]).then(([data, nextGarden]) => { if (alive) { setSessions(data); setGarden(nextGarden); } }).catch(e => { if (alive) setError(String(e.message)); }).finally(() => { if (alive) setLoading(false); }); else setLoading(false); return () => { alive = false; }; }, [user?.id]);
  useEffect(() => { const sync = () => { refresh().then(() => setError('')).catch(e => setError(e.message)); }; window.addEventListener('focus', sync); const timer = window.setInterval(sync, 15000); return () => { window.removeEventListener('focus', sync); clearInterval(timer); }; }, [refresh]);
  const activeSession = sessions.find(s => !s.ended_at) ?? null;
  useEffect(() => {
    if (!activeSession || loading || error) return;
    const startedAt = Date.parse(activeSession.started_at);
    const timer = window.setInterval(() => {
      const elapsed = Math.min(43200, Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      if (Math.floor((getStatistics(sessions).totalBreakSeconds + elapsed) / 300) > garden.awarded_milestones && !locked.current) {
        void perform(claimSeeds);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession?.id, activeSession?.started_at, sessions, garden.awarded_milestones, loading, error]);
  async function perform(action: () => Promise<void>) {
    if (locked.current) return false; locked.current = true; setBusy(true); setError('');
    try { await action(); await refresh(); return true; } catch (e) { setError(e instanceof Error ? e.message : '操作失敗，請重試'); return false; } finally { locked.current = false; setBusy(false); }
  }
  const statistics = getStatistics(sessions);
  const growth = getGrowth(garden.growing_seconds);
  const flowersCollected = garden.flowers.length;
  return { sessions, garden, activeSession, statistics, growth, achievements: getAchievements(statistics, flowersCollected), flowersCollected, busy, loading, error,
    start: async () => { await perform(startBreak); }, stop: async () => { if (activeSession) await perform(() => stopBreak(activeSession.id)); }, plant: (kind: number) => perform(() => plantSeed(kind)), retry: async () => { await perform(refresh); } };
}
type BreakData = ReturnType<typeof useBreakData>;
const BreakContext = createContext<BreakData | null>(null);
export function BreakProvider({ children }: { children: ReactNode }) { const value = useBreakData(); return <BreakContext.Provider value={value}>{children}</BreakContext.Provider>; }
export function useBreak() { const context = useContext(BreakContext); if (!context) throw new Error('BreakProvider required'); return context; }
