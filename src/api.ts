import { createClient } from '@supabase/supabase-js';
import { EMPTY_GARDEN, type BreakSession, type GardenState } from './domain';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function loadSessions(): Promise<BreakSession[]> {
  if (!supabase) throw new Error('Configure Supabase to continue.');
  const { data, error } = await supabase.from('break_sessions').select('*').order('started_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function loadGardenState(): Promise<GardenState> {
  if (!supabase) throw new Error('Configure Supabase to continue.');
  const { data, error } = await supabase.from('garden_state').select('user_id,seeds,flowers,growing_kind,growing_seconds,awarded_milestones').maybeSingle();
  if (error) throw error;
  return data ?? EMPTY_GARDEN;
}
export async function loadDisplayName(): Promise<string | null> {
  if (!supabase) throw new Error('Configure Supabase to continue.');
  const { data, error } = await supabase.from('profiles').select('display_name').maybeSingle();
  if (error) throw error;
  return data?.display_name ?? null;
}
export async function startBreak(): Promise<void> {
  const { error } = await supabase!.rpc('start_break');
  if (error) throw error;
}
export async function stopBreak(id: string): Promise<void> {
  const { error } = await supabase!.rpc('finish_break', { session_id: id });
  if (error) throw error;
}
export async function plantSeed(kind: number): Promise<void> {
  if (!supabase) throw new Error('Configure Supabase to continue.');
  const { error } = await supabase.rpc('plant_seed', { seed_kind: kind });
  if (error) throw error;
}
export async function claimSeeds(): Promise<void> {
  if (!supabase) throw new Error('Configure Supabase to continue.');
  const { error } = await supabase.rpc('claim_seeds');
  if (error) throw error;
}
