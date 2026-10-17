import type { BreakMemory, BreakSession } from '../domain';
import { useAuth } from '../context/AuthContext';
import type { getStatistics } from '../lib/statistics';
import type { getAchievements } from '../lib/achievements';

export type ProfileProps = {
  statistics: ReturnType<typeof getStatistics>;
  achievements: ReturnType<typeof getAchievements>;
  sessions: BreakSession[];
  memories?: BreakMemory[];
  memoryError?: string;
  flowersCollected: number;
  displayName?: string;
  loading?: boolean;
  error?: string;
};

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remaining}s`;
  return `${remaining}s`;
}

export function Profile({ statistics, achievements, sessions, flowersCollected, displayName, loading = false, error = '' }: ProfileProps) {
  const { user } = useAuth();
  const name = displayName || (typeof user?.user_metadata?.display_name === 'string' && user.user_metadata.display_name.trim()) || user?.email?.split('@')[0] || 'Nature lover';
  const completed = sessions.filter(session => session.ended_at !== null)
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)).slice(0, 5);
  const unlocked = achievements.filter(achievement => achievement.unlocked).length;

  return <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 text-[#314b38] sm:px-6 sm:pt-16">
    <div className="mb-9 text-center sm:mb-12">
      <p className="eyebrow">YOUR GROWTH, AT A GLANCE</p>
      <h1 className="mb-3 mt-4">Your little victories.</h1>
      <p className="m-0 text-[#73816d]">Hello, {name}. Every pause adds up.</p>
    </div>

    {loading ? <div role="status" className="rounded-3xl border border-[#e0e8d9] bg-white p-8 text-center">Loading your profile…</div>
      : error ? <div role="alert" className="rounded-3xl border border-[#e8c8bb] bg-[#fff7f2] p-8 text-center text-[#8b4d3c]">Unable to load your profile. {error}</div>
      : <>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Break statistics">
          {[
            { label: 'Total Break Time', value: duration(statistics.totalBreakSeconds), detail: 'Time you gave yourself', icon: '◷' },
            { label: 'Total Sessions', value: String(statistics.totalSessions), detail: 'Completed breaks', icon: '↗' },
            { label: 'Current Streak', value: `${statistics.currentStreak} ${statistics.currentStreak === 1 ? 'day' : 'days'}`, detail: 'Days in a row', icon: '✦' },
            { label: 'Flowers Collected', value: String(flowersCollected), detail: 'California Poppy', icon: '✿' },
          ].map((item, index) => <div key={item.label} className={`rounded-3xl border p-4 shadow-sm sm:p-6 ${index === 3 ? 'border-[#e9dbb8] bg-[#fbf4e6]' : 'border-[#e0e8d9] bg-[#fffefa]'}`}>
            <span aria-hidden="true" className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[#eaf0e5] text-xl text-[#5b7b53]">{item.icon}</span>
            <p className="mb-1 mt-5 text-sm text-[#75836e]">{item.label}</p>
            <strong className="block font-serif text-2xl font-semibold leading-tight sm:text-3xl">{item.value}</strong>
            <span className="mt-2 block text-xs text-[#899586]">{item.detail}</span>
          </div>)}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#e0e8d9] bg-[#fffefa] p-5 shadow-sm sm:p-7" aria-labelledby="achievements-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div><p className="eyebrow m-0">MILESTONES</p><h2 id="achievements-title" className="mt-2 font-serif text-3xl">Achievements</h2></div>
              <span className="text-xs text-[#75836e]">{unlocked} / {achievements.length} unlocked</span>
            </div>
            <ul className="m-0 list-none p-0">{achievements.map(achievement => <li key={achievement.id} className={`flex items-center gap-3 border-t border-[#edf0e9] py-4 ${achievement.unlocked ? '' : 'opacity-55'}`}>
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e9f0e2] text-xl text-[#5b7b53]">{achievement.unlocked ? '✦' : '○'}</span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{achievement.name}</strong><small className="block text-xs text-[#7d8b78]">{achievement.description}</small></span>
              <span className="text-xs font-semibold">{achievement.unlocked ? 'Earned' : 'Locked'}</span>
            </li>)}</ul>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-[#e9dbb8] bg-[#fbf4e6] p-5 shadow-sm sm:p-7" aria-labelledby="flowers-title">
              <p className="eyebrow m-0">A LITTLE GARDEN</p><h2 id="flowers-title" className="mt-2 font-serif text-3xl">Flower Collection</h2>
              <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white/70 p-4">
                <span aria-hidden="true" className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${flowersCollected ? 'bg-[#f4dfb1] text-[#ba782e]' : 'bg-[#ecece5] text-[#a9aea4]'}`}>✿</span>
                <span className="flex-1"><strong className="block">California Poppy</strong><small className="text-[#75836e]">{flowersCollected ? 'Collected' : 'Keep taking breaks to bloom'}</small></span>
                <span className="text-xs font-semibold text-[#75836e]">{flowersCollected ? 'Unlocked' : 'Locked'}</span>
              </div>
              <p className="mb-0 text-xs text-[#899586]">More flowers coming soon.</p>
            </div>

            <div className="rounded-3xl border border-[#e0e8d9] bg-[#fffefa] p-5 shadow-sm sm:p-7" aria-labelledby="activity-title">
              <p className="eyebrow m-0">LITTLE MOMENTS</p><h2 id="activity-title" className="mt-2 font-serif text-3xl">Recent Activity</h2>
              {completed.length === 0 ? <p className="my-5 text-sm text-[#75836e]">No breaks yet. Start your first break!</p>
                : <ol className="mb-0 mt-5 list-none p-0">{completed.map(session => <li key={session.id} className="flex items-center gap-3 border-t border-[#edf0e9] py-4">
                  <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-[#8aac7f]" />
                  <span className="min-w-0 flex-1"><strong className="block text-sm">Nature break</strong><time dateTime={session.started_at} className="block text-xs text-[#7d8b78]">{new Date(session.started_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {new Date(session.started_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}</time></span>
                  <span className="rounded-full bg-[#edf2e9] px-3 py-1 text-xs font-semibold text-[#557653]">{duration(session.duration_seconds)}</span>
                </li>)}</ol>}
            </div>
          </div>
        </div>
      </>}
  </main>;
}
