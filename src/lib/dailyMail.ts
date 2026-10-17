import { downloadMemoryPhoto, supabase } from '../api';
export type DailyLetter = { id: string; photo_path: string | null; minutes: number; shared_day: string; opened: boolean; thanked: boolean; withdrawn: boolean };
export type SharedMoment = { id: string; session_id: string; published: boolean; withdrawn: boolean };
function client() { if (!supabase) throw new Error('Account connection unavailable'); return supabase; }
export async function loadDailyLetter(): Promise<DailyLetter | null> {
  const {data,error}=await client().rpc('get_daily_mail'); if(error) throw error; return data?.[0] ?? null;
}
export async function loadSharedMoments(): Promise<SharedMoment[]> {
  const {data,error}=await client().rpc('my_mail_shares'); if(error) throw error; return data ?? [];
}
export async function shareMoment(sessionId: string, privatePath: string) {
  const existing=(await loadSharedMoments()).find(s=>s.session_id===sessionId);
  if(existing?.withdrawn) throw new Error('Sharing withdrawn');
  if(existing?.published) return;
  const photo=await downloadMemoryPhoto(privatePath);
  const {data:id,error}=await client().rpc('prepare_mail_share',{target_session:sessionId}); if(error) throw error;
  const uploaded=await client().storage.from('daily-mail').upload(`${id}.jpg`,photo,{contentType:'image/jpeg',upsert:true});
  if(uploaded.error) throw uploaded.error;
  const published=await client().rpc('publish_mail_share',{target_share:id}); if(published.error) throw published.error;
}
export async function readMailPhoto(path: string): Promise<Blob> {
  const {data,error}=await client().storage.from('daily-mail').download(path); if(error) throw error; return data;
}
export async function openLetter(id: string) { const {error}=await client().rpc('open_daily_mail',{target_delivery:id}); if(error) throw error; }
export async function thankLetter(id: string) { const {error}=await client().rpc('thank_daily_mail',{target_delivery:id}); if(error) throw error; }
export async function withdrawMoment(id: string) { const {error}=await client().rpc('withdraw_mail_share',{target_share:id}); if(error) throw error; }
export async function checkThanks(acknowledge=false): Promise<boolean> { const {data,error}=await client().rpc('mail_thanks',{acknowledge}); if(error) throw error; return Boolean(data); }
