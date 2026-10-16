import { useEffect, useState } from 'react';
import { useBreak } from '../context/BreakContext';
import { clock } from '../domain';
export function Break() {
  const data = useBreak(); const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const elapsed = data.activeSession ? Math.max(0, Math.floor((now - Date.parse(data.activeSession.started_at)) / 1000)) : 0;
  return <section><p className="eyebrow">A LITTLE PAUSE. A LITTLE GROWTH.</p><h1>Make room<br/>for a little nature.</h1><p>Step outside, breathe deeply, and let your garden grow.</p><div className="timer" aria-live="off">{clock(elapsed)}</div><p>{data.activeSession ? 'Your break is growing. Take your time.' : 'Your next little adventure starts here.'}</p><button className="primary" disabled={data.busy || data.loading || !!data.error && !data.activeSession} onClick={data.activeSession ? data.stop : data.start}>{data.busy ? 'Saving…' : data.activeSession ? 'STOP' : 'GO'}</button><p>{data.statistics.totalSessions} breaks · {Math.floor(data.statistics.totalBreakSeconds / 60)} minutes · {data.growth.stage}</p>{data.error && <div role="alert">{data.error}<p>尚未確認儲存成功。活動紀錄保留於伺服器；可重試 STOP 或重新載入。</p><button onClick={data.retry} disabled={data.busy}>重新讀取 / Retry</button></div>}<div className="history"><h2>Recent breaks</h2>{data.sessions.filter(s => s.ended_at).slice(0, 5).map(s => <p key={s.id}>{new Date(s.ended_at!).toLocaleString()} · {clock(s.duration_seconds)}</p>)}</div></section>;
}
