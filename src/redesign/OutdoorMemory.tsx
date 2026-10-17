import { useEffect, useRef, useState } from 'react';
import { saveBreakMemory } from '../api';
import type { BreakSession } from '../domain';
import { clearOutdoorDraft, emptyOutdoorDraft, getApproximateLocation, hasOutdoorMemory, prepareOutdoorPhoto, readOutdoorDraft, writeOutdoorDraft, type OutdoorDraft } from '../lib/outdoorMemory';
import { useLanguage } from './Language';
import './OutdoorMemory.css';

function errorText(error: unknown) { return error instanceof Error ? error.message : 'Please try again.'; }

export function useOutdoorMemory(userId: string | null, activeId: string | null, sessions: BreakSession[], refreshMemories: () => Promise<void>) {
  const pendingKey = `bloombreak-pending-memory-${userId}`;
  const [pendingId, setPendingId] = useState<string | null>(() => userId ? localStorage.getItem(pendingKey) : null);
  const currentId = pendingId ?? activeId;
  const draftKey = userId && currentId ? `${userId}:${currentId}` : null;
  const [draft, setDraft] = useState<OutdoorDraft>(emptyOutdoorDraft);
  const draftRef = useRef(draft);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const completedPending = Boolean(pendingId && sessions.some(session => session.id === pendingId && session.ended_at));

  useEffect(() => {
    let alive = true;
    if (!draftKey) { draftRef.current = emptyOutdoorDraft(); setDraft(draftRef.current); setReady(true); return; }
    setReady(false);
    readOutdoorDraft(draftKey).then(value => { if (alive) { draftRef.current = value; setDraft(value); setReady(true); } })
      .catch(cause => { if (alive) { setError(errorText(cause)); setReady(true); } });
    return () => { alive = false; };
  }, [draftKey]);

  function remember(next: OutdoorDraft) {
    if (!draftKey) return;
    draftRef.current = next;
    setDraft(next);
    setError(''); setMessage('');
    writes.current = writes.current.catch(() => {}).then(() => writeOutdoorDraft(draftKey, next));
    void writes.current.catch(cause => setError(`Draft was not kept on this device: ${errorText(cause)}`));
  }

  function setNote(note: string) {
    if (note.length > 120) return;
    remember({ ...draftRef.current, note, capturedAt: draftRef.current.capturedAt ?? new Date().toISOString() });
  }

  async function setPhoto(file: File) {
    setBusy(true); setError('');
    try { const photo = await prepareOutdoorPhoto(file); remember({ ...draftRef.current, photo, capturedAt: draftRef.current.capturedAt ?? new Date().toISOString() }); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  async function addLocation() {
    setBusy(true); setError('');
    try { const location = await getApproximateLocation(); remember({ ...draftRef.current, ...location, capturedAt: draftRef.current.capturedAt ?? new Date().toISOString() }); }
    catch (cause) { setError(`Location was not added: ${errorText(cause)}`); }
    finally { setBusy(false); }
  }

  function removeLocation() { remember({ ...draftRef.current, latitude: null, longitude: null }); }
  function removePhoto() { remember({ ...draftRef.current, photo: null }); }

  async function discard() {
    if (!draftKey) return;
    setBusy(true);
    try {
      await writes.current.catch(() => {});
      await clearOutdoorDraft(draftKey);
      localStorage.removeItem(pendingKey);
      setPendingId(null);
      draftRef.current = emptyOutdoorDraft(); setDraft(draftRef.current);
      setError(''); setMessage('Memory skipped. The timer is unchanged.');
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }

  async function save(id: string) {
    if (!userId || !draftKey || !hasOutdoorMemory(draftRef.current)) return;
    setBusy(true); setError('');
    try {
      await writes.current;
      const snapshot = draftRef.current;
      await saveBreakMemory(id, userId, snapshot);
      await clearOutdoorDraft(draftKey);
      localStorage.removeItem(pendingKey);
      setPendingId(null);
      draftRef.current = emptyOutdoorDraft(); setDraft(draftRef.current);
      setMessage('Memory saved privately.');
      await refreshMemories();
    } catch (cause) { setError(`Memory was not saved. Your break is safe. Retry: ${errorText(cause)}`); }
    finally { setBusy(false); }
  }

  async function stopAndSave(stop: () => Promise<boolean>) {
    if (!activeId) return;
    if (pendingId && pendingId !== activeId) { await stop(); return; }
    const hasDraft = hasOutdoorMemory(draftRef.current);
    if (hasDraft) { localStorage.setItem(pendingKey, activeId); setPendingId(activeId); }
    const stopped = await stop();
    if (stopped && hasDraft) await save(activeId);
  }

  return { draft, ready, busy, error, message, pendingId, completedPending, canCapture: Boolean(activeId && (!pendingId || pendingId === activeId)), setNote, setPhoto, removePhoto, addLocation, removeLocation, discard, retry: () => pendingId && completedPending ? save(pendingId) : Promise.resolve(), stopAndSave };
}

type MemoryControls = ReturnType<typeof useOutdoorMemory>;
export function OutdoorMemoryForm({ memory, active, onClose }: { memory: MemoryControls; active: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!memory.draft.photo) { setPreview(null); return; }
    const url = URL.createObjectURL(memory.draft.photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [memory.draft.photo]);
  return <div className="outdoor-memory-form">
    <p>{t('趁你還在戶外，記下這一刻。全部都是選填，只有你能看見。', 'Capture this moment while you are outside. Everything here is optional and private.')}</p>
    <label className="memory-note">{t('一句話', 'One thought')} <span>{memory.draft.note.length}/120</span>
      <textarea maxLength={120} value={memory.draft.note} disabled={!active || !memory.ready || memory.busy} onChange={event => memory.setNote(event.target.value)} placeholder={t('你在戶外注意到了什麼？', 'What did you notice outdoors?')} rows={3}/>
    </label>
    <div className="memory-photo-actions">
      <label className="memory-action">{t('拍照', 'Take photo')}<input type="file" accept="image/*" capture="environment" disabled={!active || memory.busy} onChange={event => { const file = event.target.files?.[0]; if (file) void memory.setPhoto(file); event.target.value = ''; }}/></label>
      <label className="memory-action">{t('從相簿選擇', 'Choose photo')}<input type="file" accept="image/*" disabled={!active || memory.busy} onChange={event => { const file = event.target.files?.[0]; if (file) void memory.setPhoto(file); event.target.value = ''; }}/></label>
    </div>
    {preview && <><img className="memory-preview" src={preview} alt={t('你選的戶外照片', 'Your selected outdoor moment')}/>{active && <button className="memory-remove" onClick={memory.removePhoto}>{t('移除照片', 'Remove photo')}</button>}</>}
    <button className="memory-location" disabled={!active || memory.busy} onClick={() => void memory.addLocation()}>{memory.draft.latitude !== null ? `⌖ ${t('約略位置', 'Approx.')} ${memory.draft.latitude.toFixed(2)}, ${memory.draft.longitude?.toFixed(2)}` : `⌖ ${t('加入約略位置', 'Add approximate location')}`}</button>
    {active && memory.draft.latitude !== null && <button className="memory-remove" onClick={memory.removeLocation}>{t('移除位置', 'Remove location')}</button>}
    <small>{t('只有點選時才取得位置。照片會移除內嵌的 GPS 資料。', 'Your location is captured only when you tap. Your photo is converted to remove embedded GPS data.')}</small>
    {memory.error && <p role="alert" className="memory-error">{memory.error}</p>}
    <div className="memory-footer">{memory.completedPending ? <button className="memory-discard" onClick={onClose}>{t('關閉', 'Close')}</button> : <button className="memory-discard" disabled={memory.busy} onClick={() => { void memory.discard().then(onClose); }}>{t('略過記錄', 'Skip memory')}</button>}{memory.completedPending ? <button className="memory-primary" disabled={memory.busy} onClick={() => void memory.retry()}>{memory.busy ? t('儲存中…', 'Saving…') : t('重試儲存', 'Retry save')}</button> : <button className="memory-primary" onClick={onClose}>{t('完成', 'Done')}</button>}</div>
  </div>;
}
