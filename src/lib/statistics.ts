import type { BreakSession } from '../domain';
export function getStatistics(sessions: BreakSession[], now = new Date()) {
  const completed = sessions.filter(s => s.ended_at !== null);
  const localDay = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const days = new Set(completed.map(s => localDay(new Date(s.ended_at!))));
  const cursor = new Date(now); let currentStreak = 0;
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDay(cursor))) { currentStreak++; cursor.setDate(cursor.getDate() - 1); }
  return { totalBreakSeconds: completed.reduce((n, s) => n + s.duration_seconds, 0), totalSessions: completed.length, currentStreak };
}
