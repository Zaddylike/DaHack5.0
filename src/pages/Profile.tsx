import type { BreakSession } from '../domain';
import type { getStatistics } from '../lib/statistics';
import type { getAchievements } from '../lib/achievements';
export type ProfileProps = { statistics: ReturnType<typeof getStatistics>; achievements: ReturnType<typeof getAchievements>; sessions: BreakSession[]; flowersCollected: number };
export function Profile(_props: ProfileProps) { return <section><p className="eyebrow">YOUR GROWTH, AT A GLANCE</p><h1>Profile</h1><p>Member C: statistics, achievements and recent activity will live here.</p></section>; }
