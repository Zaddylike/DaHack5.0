// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from './context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { useBreakData } from './context/BreakContext';
import { useDemoState } from './context/DemoContext';
import { getGrowth } from './lib/growth';
import { getStatistics } from './lib/statistics';
import { getAchievements } from './lib/achievements';
import type { BreakSession } from './domain';
const mocks = vi.hoisted(() => ({ loadSessions: vi.fn(), startBreak: vi.fn(), stopBreak: vi.fn() }));
vi.mock('./api', () => ({ ...mocks, supabase: null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const user = { id: 'user-a' } as User;
const active: BreakSession = { id: 'session-a', user_id: user.id, started_at: new Date().toISOString(), ended_at: null, duration_seconds: 0 };
const wrapper = ({ children }: { children: React.ReactNode }) => <AuthContext.Provider value={{ user, loading: false, error: '' }}>{children}</AuthContext.Provider>;
describe('growth', () => {
  it.each([[0, 0], [2519, 0], [2520, 1], [5040, 2], [8820, 3], [12600, 4], [99999, 4], [-1, 0]])('maps %s seconds to stage %s', (seconds, stage) => expect(getGrowth(seconds).stageIndex).toBe(stage));
  it('calculates next-stage progress', () => { expect(getGrowth(1260).nextStagePercent).toBe(50); expect(getGrowth(12600).isBloom).toBe(true); });
});
it('unlocks Nature Beginner after 10 completed minutes', () => {
  expect(getAchievements({ totalBreakSeconds: 599, totalSessions: 1, currentStreak: 0 })[1].unlocked).toBe(false);
  expect(getAchievements({ totalBreakSeconds: 600, totalSessions: 1, currentStreak: 0 })[1].unlocked).toBe(true);
});
it('protects unauthenticated routes and waits for restoration', () => {
  const tree = (loading: boolean, currentUser: User | null) => <AuthContext.Provider value={{ user: currentUser, loading, error: '' }}><MemoryRouter initialEntries={['/break']}><Routes><Route path="/login" element={<p>Login page</p>}/><Route element={<ProtectedRoute/>}><Route path="/break" element={<p>Break page</p>}/></Route></Routes></MemoryRouter></AuthContext.Provider>;
  const view = render(tree(true, null)); expect(screen.queryByText('Restoring session…')).not.toBeNull();
  view.rerender(tree(false, null)); expect(screen.queryByText('Login page')).not.toBeNull(); view.unmount();
  render(tree(false, user)); expect(screen.queryByText('Break page')).not.toBeNull();
});
it('GO/STOP refresh official sessions and rejects duplicate concurrent STOP', async () => {
  mocks.loadSessions.mockResolvedValueOnce([]).mockResolvedValueOnce([active]).mockResolvedValue([{ ...active, ended_at: new Date().toISOString(), duration_seconds: 60 }]);
  mocks.startBreak.mockResolvedValue(undefined);
  let finish!: () => void; mocks.stopBreak.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const { result } = renderHook(useBreakData, { wrapper }); await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.start()); expect(result.current.activeSession?.id).toBe(active.id);
  let pending!: Promise<void>; act(() => { pending = result.current.stop(); void result.current.stop(); }); expect(mocks.stopBreak).toHaveBeenCalledTimes(1);
  await act(async () => { finish(); await pending; }); expect(result.current.statistics.totalBreakSeconds).toBe(60); expect(result.current.activeSession).toBeNull();
});
it('retains active server session on failed STOP and allows retry', async () => {
  mocks.loadSessions.mockResolvedValue([active]); mocks.stopBreak.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const { result } = renderHook(useBreakData, { wrapper }); await waitFor(() => expect(result.current.activeSession).not.toBeNull());
  await act(() => result.current.stop()); expect(result.current.error).toBe('offline'); expect(result.current.activeSession?.id).toBe(active.id); expect(result.current.statistics.totalSessions).toBe(0);
  mocks.loadSessions.mockResolvedValue([{ ...active, ended_at: new Date().toISOString(), duration_seconds: 90 }]); await act(() => result.current.stop()); expect(result.current.error).toBe(''); expect(result.current.statistics.totalBreakSeconds).toBe(90);
});
it('does not create active state when GO fails', async () => {
  mocks.loadSessions.mockResolvedValue([]); mocks.startBreak.mockRejectedValueOnce(new Error('offline'));
  const { result } = renderHook(useBreakData, { wrapper }); await waitFor(() => expect(result.current.loading).toBe(false)); await act(() => result.current.start()); expect(result.current.activeSession).toBeNull(); expect(result.current.error).toBe('offline');
});
it('isolates demo state from API, statistics and achievements', () => {
  const official = getStatistics([]); const before = getAchievements(official);
  const { result } = renderHook(useDemoState); act(() => { result.current.setEnabled(true); });
  for (let i = 0; i < 6; i++) act(() => result.current.next()); expect(result.current.stage).toBe('Bloom');
  act(() => result.current.previous()); expect(result.current.stage).toBe('Bud'); act(() => result.current.reset()); expect(result.current.stage).toBe('Seed');
  expect(getStatistics([])).toEqual(official); expect(getAchievements(official)).toEqual(before); expect(mocks.startBreak).not.toHaveBeenCalled(); expect(mocks.stopBreak).not.toHaveBeenCalled();
});
it('uses local calendar dates for streak and ignores unfinished sessions', () => {
  const now = new Date(2026, 9, 16, 12);
  const sessions = [14, 15, 16].map(day => ({ ...active, ended_at: new Date(2026, 9, day, 10).toISOString(), duration_seconds: 600 }));
  const stats = getStatistics([...sessions, active], now); expect(stats).toEqual({ totalBreakSeconds: 1800, totalSessions: 3, currentStreak: 3 });
});
it('restores an active timer from persisted sessions on mount', async () => {
  mocks.loadSessions.mockResolvedValue([active]);
  const { result } = renderHook(useBreakData, { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.activeSession).toEqual(active);
  expect(mocks.startBreak).not.toHaveBeenCalled();
});
it('prevents duplicate concurrent GO requests', async () => {
  mocks.loadSessions.mockResolvedValue([]);
  let finish!: () => void; mocks.startBreak.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const { result } = renderHook(useBreakData, { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  let pending!: Promise<void>;
  act(() => { pending = result.current.start(); void result.current.start(); });
  expect(mocks.startBreak).toHaveBeenCalledTimes(1);
  mocks.loadSessions.mockResolvedValue([active]);
  await act(async () => { finish(); await pending; });
  expect(result.current.activeSession).toEqual(active);
});
