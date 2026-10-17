// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccountSummary } from './AccountSummary';
import { getAchievements } from '../lib/achievements';

const statistics = { totalBreakSeconds: 600, totalSessions: 1, currentStreak: 1 };
const props = {
  statistics,
  achievements: getAchievements(statistics),
  sessions: [{ id: 'one', user_id: 'me', started_at: '2026-10-16T12:00:00Z', ended_at: '2026-10-16T12:10:00Z', duration_seconds: 600 }],
  flowersCollected: 0,
};

afterEach(cleanup);
describe('cloud profile summary', () => {
  it('shows shared statistics, achievements, collection state and activity', () => {
    render(<AccountSummary {...props}/>);
    expect(screen.getAllByText('10m 0s')).toHaveLength(2);
    expect(screen.getByText('Nature Beginner')).toBeTruthy();
    expect(screen.getByText('California Poppy')).toBeTruthy();
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0);
    expect(screen.getByText('Nature break')).toBeTruthy();
  });
  it('shows empty, loading and failure states without claiming data loaded', () => {
    const view = render(<AccountSummary {...props} sessions={[]}/>);
    expect(screen.getByText('No breaks yet. Start your first break!')).toBeTruthy();
    view.rerender(<AccountSummary {...props} loading/>);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('Total Break Time')).toBeNull();
    view.rerender(<AccountSummary {...props} error="Offline"/>);
    expect(screen.getByRole('alert').textContent).toContain('Offline');
  });
  it('shows only the matching session memory and reports memory loading errors separately', () => {
    const memory = { session_id: 'one', user_id: 'me', note: 'A quiet patch of sun', latitude_approx: 37.33, longitude_approx: -121.89, photo_path: null, captured_at: '2026-10-16T12:05:00Z' };
    const view = render(<AccountSummary {...props} memories={[memory]}/>);
    expect(screen.getByText(/A quiet patch of sun/)).toBeTruthy();
    expect(screen.getByText(/Approx. 37.33, -121.89/)).toBeTruthy();
    view.rerender(<AccountSummary {...props} memories={[]} memoryError="Offline"/>);
    expect(screen.getByRole('alert').textContent).toContain('Offline');
    expect(screen.getByText('Nature break')).toBeTruthy();
  });
});
