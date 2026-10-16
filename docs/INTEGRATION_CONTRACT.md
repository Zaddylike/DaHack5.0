# BloomBreak Integration Contract

## Ownership
A owns `src/api.ts`, `src/domain.ts`, `src/lib/*`, `src/context/*`, `src/main.tsx`, migrations and dependencies. B owns `src/pages/Garden.tsx` and new Garden-specific components/styles. C owns `src/pages/Profile.tsx` and new Profile-specific components/styles. Shared navigation/style changes require coordination with A. B/C must not import Supabase or write database code.

## Garden
`Garden` / `GardenProps` exported by `src/pages/Garden.tsx`:
- `growth`: `ReturnType<typeof getGrowth>` from `src/lib/growth.ts`: stage, stageIndex (0–4), percent (0–100), nextStagePercent (0–100 within current stage), secondsToNextStage, isBloom.
- `demo`: `ReturnType<typeof useDemoState>` from `src/context/DemoContext.tsx`: enabled, setEnabled(boolean), stageIndex, stage, next(), previous(), reset(). Use demo stage only when enabled. Demo never changes official growth.
- No save callback. Clicking plants and animation are local presentation state.

## Profile
`Profile` / `ProfileProps` exported by `src/pages/Profile.tsx`:
- statistics: totalBreakSeconds, totalSessions, currentStreak.
- achievements: array of id, name, description, unlocked.
- sessions: BreakSession[] ordered newest start first; filter ended_at !== null for recent completed activity.
- flowersCollected: 0 or 1. MVP has one persistent California Poppy; it does not reset after bloom.
- Read-only, no mutation callbacks.

## Shared sources
`useBreak()` in `src/context/BreakContext.tsx` owns server snapshots, activeSession, statistics, growth, achievements, flowersCollected, busy, loading, error and start()/stop()/retry(). Hooks require BreakProvider, mounted only inside protected layout. Prefer props above in member-owned pages. `useDemo()` requires DemoProvider and is entirely local. Login state: `useAuth()` returns user/loading/error.

`BreakSession` (`src/domain.ts`): id: string; user_id: string; started_at: ISO timestamp; ended_at: ISO timestamp | null; duration_seconds: integer. Active sessions have null ended_at and zero seconds. `Profile` has user_id/display_name. `FlowerCollection` has id/user_id/species/collected_at.

All growth uses `getGrowth(totalBreakSeconds)`; current demo thresholds are 0, 120, 300, 420 and 600 completed seconds for Seed, Sprout, Seedling, Bud and Bloom. This 10-minute game setting is not a scientific growth claim. Streak uses current browser local calendar dates; today or yesterday may anchor a streak. Achievements: First Step ≥1 session; Nature Beginner ≥600 seconds; Bloom Master ≥600 seconds; Consistency ≥3 current consecutive days. Demo changes none of these.

## Failure and concurrency
GO persists active row before timer starts. Unique partial index + per-user transaction lock make GO idempotent across devices. Refresh restores server active row. STOP targets that row's UUID; repeated calls return successfully without double counting. Server timestamps determine durations, capped at 12 hours/session. Server transaction updates projections atomically. A failed response may mean the operation committed: refresh or retry is safe. Network loss before STOP reaches server means the break continues until STOP succeeds; no offline stop timestamp is promised. Existing active row is retained on read/write errors; UI never claims success. Reload during offline operation cannot restore server data until connectivity returns. Other devices synchronize on focus/every 15 seconds; totals refresh after confirmed mutations.
