// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { BreakSession } from '../domain';
import { useOutdoorMemory } from './OutdoorMemory';

const mocks = vi.hoisted(() => ({ save: vi.fn(), read: vi.fn(), write: vi.fn(), clear: vi.fn() }));
vi.mock('../api', () => ({ saveBreakMemory: mocks.save }));
vi.mock('../lib/outdoorMemory', async importOriginal => {
  const original = await importOriginal<typeof import('../lib/outdoorMemory')>();
  return { ...original, readOutdoorDraft: mocks.read, writeOutdoorDraft: mocks.write, clearOutdoorDraft: mocks.clear };
});

const active: BreakSession = { id: 'session-a', user_id: 'user-a', started_at: '2026-10-17T08:00:00Z', ended_at: null, duration_seconds: 0 };
const finished = { ...active, ended_at: '2026-10-17T08:05:00Z', duration_seconds: 300 };
const note = { note: 'Saw a poppy', latitude: 37.33, longitude: -121.89, capturedAt: '2026-10-17T08:02:00Z', photo: null };

beforeEach(() => {
  localStorage.clear();
  mocks.read.mockResolvedValue(note);
  mocks.write.mockResolvedValue(undefined);
  mocks.clear.mockResolvedValue(undefined);
  mocks.save.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('saves an optional outdoor memory only after STOP succeeds', async () => {
  const stop = vi.fn().mockResolvedValue(true);
  const refresh = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useOutdoorMemory('user-a', active.id, [active], refresh));
  await waitFor(() => expect(result.current.ready).toBe(true));
  await act(async () => result.current.stopAndSave(stop));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(mocks.save).toHaveBeenCalledWith(active.id, 'user-a', note);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(result.current.message).toContain('saved privately');
});

it('retains the draft when STOP fails, then allows a safe retry after completion', async () => {
  const stop = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  mocks.save.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  const refresh = vi.fn().mockResolvedValue(undefined);
  const { result, rerender } = renderHook(({ sessions }) => useOutdoorMemory('user-a', sessions[0]?.ended_at ? null : active.id, sessions, refresh), { initialProps: { sessions: [active] as BreakSession[] } });
  await waitFor(() => expect(result.current.ready).toBe(true));
  await act(async () => result.current.stopAndSave(stop));
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.clear).not.toHaveBeenCalled();
  await act(async () => result.current.stopAndSave(stop));
  expect(result.current.error).toContain('Your break is safe');
  expect(mocks.clear).not.toHaveBeenCalled();
  rerender({ sessions: [finished] });
  await waitFor(() => expect(result.current.completedPending).toBe(true));
  await act(async () => result.current.retry());
  expect(mocks.save).toHaveBeenCalledTimes(2);
  expect(mocks.clear).toHaveBeenCalledTimes(1);
});

it('keeps the core break independent when no memory was captured', async () => {
  mocks.read.mockResolvedValue({ note: '', latitude: null, longitude: null, capturedAt: null, photo: null });
  const stop = vi.fn().mockResolvedValue(true);
  const { result } = renderHook(() => useOutdoorMemory('user-a', active.id, [active], vi.fn()));
  await waitFor(() => expect(result.current.ready).toBe(true));
  await act(async () => result.current.stopAndSave(stop));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(mocks.save).not.toHaveBeenCalled();
});
