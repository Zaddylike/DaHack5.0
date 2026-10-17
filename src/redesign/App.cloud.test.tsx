// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { EMPTY_GARDEN } from '../domain';
import { freshSave } from './model';
import { App } from './App';

const mock = vi.hoisted(() => ({ plant: vi.fn(), start: vi.fn() }));
vi.mock('./Garden3D', () => ({ default: () => <div aria-label="3D scene"/> }));
vi.mock('../context/BreakContext', () => ({
  BreakProvider: ({ children }: { children: React.ReactNode }) => children,
  useBreak: () => ({ garden: { ...EMPTY_GARDEN, flowers: [0], seeds: [0, 1, 0, 0, 0] },
    sessions: [], activeSession: null, statistics: { totalBreakSeconds: 600, totalSessions: 1, currentStreak: 1 },
    achievements: [], flowersCollected: 1, busy: false, loading: false, error: '',
    start: mock.start, stop: vi.fn(), retry: vi.fn(), plant: mock.plant }),
}));

beforeEach(() => { localStorage.clear(); localStorage.setItem('bloombreak-language', 'zh'); localStorage.setItem('bloombreak-ui-user-a', JSON.stringify({ ...freshSave, storySeen: true })); mock.plant.mockResolvedValue(true); HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); }; });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('shows the signed-in seed bag and plants the chosen cloud seed', async () => {
  render(<MemoryRouter initialEntries={['/garden']}><AuthContext.Provider value={{ user: { id: 'user-a', email: 'demo@example.com' } as never, loading: false, error: '' }}><App/></AuthContext.Provider></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /种子 · 1/ }));
  fireEvent.click(screen.getByRole('button', { name: /雏菊.*1/ }));
  await waitFor(() => expect(mock.plant).toHaveBeenCalledWith(1));
});

it('responds to GO immediately while the cloud request is pending', async () => {
  let resolveStart!: () => void;
  mock.start.mockImplementationOnce(() => new Promise<void>(resolve => { resolveStart = resolve; }));
  render(<MemoryRouter initialEntries={['/break']}><AuthContext.Provider value={{ user: { id: 'user-a', email: 'demo@example.com' } as never, loading: false, error: '' }}><App/></AuthContext.Provider></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '开始户外计时' }));
  const pending = screen.getByRole('button', { name: '启动计时中' }) as HTMLButtonElement;
  expect(pending.disabled).toBe(true);
  expect(screen.getByText('启动中…')).toBeTruthy();
  expect(mock.start).toHaveBeenCalledTimes(1);
  resolveStart();
  await waitFor(() => expect(screen.getByRole('button', { name: '开始户外计时' })).toBeTruthy());
});

it('labels the color setting Timer Color in English', () => {
  localStorage.setItem('bloombreak-language', 'en');
  render(<MemoryRouter initialEntries={['/profile']}><AuthContext.Provider value={{ user: { id: 'user-a', email: 'demo@example.com' } as never, loading: false, error: '' }}><App/></AuthContext.Provider></MemoryRouter>);
  expect(screen.getByText('Timer Color')).toBeTruthy();
});
