import type { ProfileProps } from '../pages/Profile';

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

export function AccountSummary({ statistics, achievements, sessions, flowersCollected, loading = false, error = '' }: ProfileProps) {
  if (loading) return <section className="account-summary" role="status">Loading your profile…</section>;
  if (error) return <section className="account-summary" role="alert">Unable to load your profile. {error}</section>;

  const recent = sessions.filter(session => session.ended_at !== null)
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)).slice(0, 5);
  const cards = [
    ['Total Break Time', duration(statistics.totalBreakSeconds)],
    ['Total Sessions', String(statistics.totalSessions)],
    ['Current Streak', `${statistics.currentStreak} ${statistics.currentStreak === 1 ? 'day' : 'days'}`],
    ['Flowers Collected', String(flowersCollected)],
  ];

  return <div className="account-summary">
    <div className="account-stats" aria-label="Break statistics">{cards.map(([label, value]) => <div className="account-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <section className="account-panel" aria-labelledby="account-achievements"><h2 id="account-achievements">Achievements</h2><ul>{achievements.map(achievement => <li className={achievement.unlocked ? '' : 'account-locked'} key={achievement.id}><span aria-hidden="true">{achievement.unlocked ? '✦' : '○'}</span><div><strong>{achievement.name}</strong><small>{achievement.description}</small></div><em>{achievement.unlocked ? 'Earned' : 'Locked'}</em></li>)}</ul></section>
    <section className="account-panel" aria-labelledby="account-collection"><h2 id="account-collection">Flower Collection</h2><div className={`account-flower ${flowersCollected ? '' : 'account-locked'}`}><span aria-hidden="true">✿</span><div><strong>California Poppy</strong><small>{flowersCollected ? 'Collected' : 'Keep taking breaks to bloom'}</small></div><em>{flowersCollected ? 'Unlocked' : 'Locked'}</em></div><p>More flowers coming soon.</p></section>
    <section className="account-panel" aria-labelledby="account-activity"><h2 id="account-activity">Recent Activity</h2>{recent.length ? <ol>{recent.map(session => <li key={session.id}><div><strong>Nature break</strong><time dateTime={session.started_at}>{new Date(session.started_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {new Date(session.started_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}</time></div><span>{duration(session.duration_seconds)}</span></li>)}</ol> : <p>No breaks yet. Start your first break!</p>}</section>
  </div>;
}
