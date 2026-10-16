// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from '../context/AuthContext';
import type { BreakSession } from '../domain';
import { getStatistics } from '../lib/statistics';
import { getAchievements } from '../lib/achievements';
import { Profile, type ProfileProps } from './Profile';

afterEach(cleanup);

const older: BreakSession = { id: 'older', user_id: 'user-a', started_at: '2026-10-14T10:00:00Z', ended_at: '2026-10-14T10:10:00Z', duration_seconds: 600 };
const newer: BreakSession = { id: 'newer', user_id: 'user-a', started_at: '2026-10-15T10:00:00Z', ended_at: '2026-10-15T10:20:00Z', duration_seconds: 1200 };
const active: BreakSession = { id: 'active', user_id: 'user-a', started_at: '2026-10-16T10:00:00Z', ended_at: null, duration_seconds: 0 };

function show(overrides: Partial<ProfileProps> = {}) {
  const sessions = [older, active, newer];
  const statistics = getStatistics(sessions, new Date('2026-10-16T15:00:00Z'));
  const props: ProfileProps = { statistics, achievements: getAchievements(statistics), sessions, flowersCollected: 1, ...overrides };
  return render(<AuthContext.Provider value={{ user: { id: 'user-a', email: 'alex@example.com' } as User, loading: false, error: '' }}><Profile {...props} /></AuthContext.Provider>);
}

it('shows shared statistics, achievement state, collection, and completed activity newest first', () => {
  show();
  const stats = screen.getByLabelText('Break statistics');
  expect(within(stats).getByText('30m 0s')).toBeTruthy();
  expect(within(stats).getByText('Total Sessions')).toBeTruthy();
  expect(within(stats).getByText('2')).toBeTruthy();
  expect(screen.getByText('Hello, alex. Every pause adds up.')).toBeTruthy();
  expect(screen.getByText('First Step')).toBeTruthy();
  expect(screen.getAllByText('Earned').length).toBeGreaterThan(0);
  expect(screen.getByText('Nature Beginner')).toBeTruthy();
  expect(screen.getAllByText('California Poppy').length).toBeGreaterThan(0);
  expect(screen.getByText('Unlocked')).toBeTruthy();
  const activity = screen.getByLabelText('Recent Activity').querySelectorAll('li');
  expect(activity).toHaveLength(2);
  expect(activity[0].textContent).toContain('20m 0s');
  expect(activity[1].textContent).toContain('10m 0s');
});

it('shows empty, loading, and failed-load states without implying data was loaded', () => {
  const empty = getStatistics([]);
  const props = { statistics: empty, achievements: getAchievements(empty), sessions: [], flowersCollected: 0 };
  const view = show(props);
  expect(screen.getByText('No breaks yet. Start your first break!')).toBeTruthy();
  expect(screen.getAllByText('Locked', { selector: 'span' }).length).toBeGreaterThan(0);
  view.rerender(<Profile {...props} loading />);
  expect(screen.getByRole('status').textContent).toContain('Loading');
  expect(screen.queryByText('No breaks yet. Start your first break!')).toBeNull();
  view.rerender(<Profile {...props} error="offline" />);
  expect(screen.getByRole('alert').textContent).toContain('offline');
  expect(screen.queryByText('No breaks yet. Start your first break!')).toBeNull();
});
