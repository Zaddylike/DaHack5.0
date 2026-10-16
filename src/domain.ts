export type BreakSession = { id: string; user_id: string; started_at: string; ended_at: string | null; duration_seconds: number };
export type Profile = { user_id: string; display_name: string };
export type FlowerCollection = { id: string; user_id: string; species: string; collected_at: string };
export function clock(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`; }
