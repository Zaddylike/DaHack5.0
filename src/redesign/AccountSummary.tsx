import { useEffect, useState } from 'react';
import { downloadMemoryPhoto } from '../api';
import type { ProfileProps } from '../pages/Profile';
import { englishFlowers } from './Language';

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function PrivateMemoryPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    downloadMemoryPhoto(path).then(blob => {
      objectUrl = URL.createObjectURL(blob);
      if (alive) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  if (failed) return <small role="alert">Photo unavailable</small>;
  return url ? <img className="account-memory-photo" src={url} alt="Your outdoor memory"/> : <small>Loading photo…</small>;
}

export function AccountSummary({ statistics, achievements, sessions, memories = [], memoryError = '', flowersCollected, flowerKinds = [], loading = false, error = '' }: ProfileProps & { flowerKinds?: number[] }) {
  if (loading) return <section className="account-summary" role="status">Loading your profile…</section>;
  if (error) return <section className="account-summary" role="alert">Unable to load your profile. {error}</section>;

  const recent = sessions.filter(session => session.ended_at !== null)
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)).slice(0, 5);
  const memoryBySession = new Map(memories.map(memory => [memory.session_id, memory]));
  const cards = [
    ['Total Break Time', duration(statistics.totalBreakSeconds)],
    ['Total Sessions', String(statistics.totalSessions)],
    ['Current Streak', `${statistics.currentStreak} ${statistics.currentStreak === 1 ? 'day' : 'days'}`],
    ['Flowers Collected', String(flowersCollected)],
  ];

  return <div className="account-summary">
    <div className="account-stats" aria-label="Break statistics">{cards.map(([label, value]) => <div className="account-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <section className="account-panel" aria-labelledby="account-achievements"><h2 id="account-achievements">Achievements</h2><ul>{achievements.map(achievement => <li className={achievement.unlocked ? '' : 'account-locked'} key={achievement.id}><span aria-hidden="true">{achievement.unlocked ? '✦' : '○'}</span><div><strong>{achievement.name}</strong><small>{achievement.description}</small></div><em>{achievement.unlocked ? 'Earned' : 'Locked'}</em></li>)}</ul></section>
    <section className="account-panel" aria-labelledby="account-collection"><h2 id="account-collection">Flower Collection</h2>{englishFlowers.map((flower, kind) => { const collected = flowerKinds.includes(kind) || kind === 0 && flowerKinds.length === 0 && flowersCollected > 0; return <div key={flower.name} className={`account-flower ${collected ? '' : 'account-locked'}`}><span aria-hidden="true">✿</span><div><strong>{kind === 0 ? 'California Poppy' : flower.name}</strong><small>{collected ? 'Collected' : 'Keep taking breaks to bloom'}</small></div><em>{collected ? 'Unlocked' : 'Locked'}</em></div>; })}</section>
    <section className="account-panel" aria-labelledby="account-activity"><h2 id="account-activity">Recent Activity</h2>{memoryError && <p role="alert">Outdoor memories could not be loaded: {memoryError}</p>}{recent.length ? <ol>{recent.map(session => { const memory = memoryBySession.get(session.id); return <li key={session.id} className="account-activity-item"><div><strong>Nature break</strong><time dateTime={session.started_at}>{new Date(session.started_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {new Date(session.started_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}</time>{memory?.note && <p className="account-memory-note">“{memory.note}”</p>}{memory?.latitude_approx !== null && memory?.latitude_approx !== undefined && <small>⌖ Approx. {memory.latitude_approx.toFixed(2)}, {memory.longitude_approx?.toFixed(2)}</small>}{memory?.photo_path && <PrivateMemoryPhoto path={memory.photo_path}/>}</div><span>{duration(session.duration_seconds)}</span></li>; })}</ol> : <p>No breaks yet. Start your first break!</p>}</section>
  </div>;
}
