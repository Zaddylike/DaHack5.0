import type { getStatistics } from './statistics';
import { BLOOM_SECONDS } from './growth';
export function getAchievements(stats: ReturnType<typeof getStatistics>) {
  return [
    { id: 'first-step', name: 'First Step', unlocked: stats.totalSessions >= 1, description: 'Complete one break' },
    { id: 'nature-beginner', name: 'Nature Beginner', unlocked: stats.totalBreakSeconds >= 600, description: 'Rest for 10 minutes in total' },
    { id: 'bloom-master', name: 'Bloom Master', unlocked: stats.totalBreakSeconds >= BLOOM_SECONDS, description: 'Grow your first flower' },
    { id: 'consistency', name: 'Consistency', unlocked: stats.currentStreak >= 3, description: 'Take breaks on 3 consecutive days' },
  ];
}
