import { useEffect, useState } from 'react';
import { Garden } from './pages/Garden';
import { Profile } from './pages/Profile';
import { useDemoState } from './context/DemoContext';
import { getGrowth } from './lib/growth';
import { getStatistics } from './lib/statistics';
import { getAchievements } from './lib/achievements';
import { clock } from './domain';
export function Preview() {
  const [page, setPage] = useState<'Break' | 'Garden' | 'Profile'>('Break');
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const demo = useDemoState();
  useEffect(() => { if (started === null) return; const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => clearInterval(timer); }, [started]);
  const sample = [{ id: 'sample', user_id: 'preview', started_at: new Date().toISOString(), ended_at: new Date().toISOString(), duration_seconds: 300 }];
  const statistics = getStatistics(sample);
  const growth = getGrowth(statistics.totalBreakSeconds);
  return <><div className="preview-banner">畫面預覽 · 範例資料，不會儲存　 <a href="/login">前往正式登入</a></div><header><span className="brand">✿ BloomBreak</span><nav>{(['Break','Garden','Profile'] as const).map(name => <button key={name} className={page === name ? 'selected' : ''} onClick={() => setPage(name)}>{name}</button>)}</nav></header>
    {page === 'Break' && <section><p className="eyebrow">A LITTLE PAUSE. A LITTLE GROWTH.</p><h1>Make room<br/>for a little nature.</h1><p>Step outside, breathe deeply, and let your garden grow.</p><div className="timer">{clock(elapsed)}</div><p>{started ? 'Your break is growing. Take your time.' : 'Your next little adventure starts here.'}</p><button className="primary" onClick={() => { if (started) { setStarted(null); setElapsed(0); } else setStarted(Date.now()); }}>{started ? 'STOP' : 'GO'}</button><p className="muted">預覽計時不會建立正式休息紀錄</p></section>}
    {page === 'Garden' && <Garden growth={growth} demo={demo}/>}
    {page === 'Profile' && <Profile statistics={statistics} achievements={getAchievements(statistics)} sessions={sample} flowersCollected={0}/>}
  </>;
}
