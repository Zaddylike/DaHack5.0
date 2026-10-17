export type BreakSession = { id: string; user_id: string; started_at: string; ended_at: string | null; duration_seconds: number };
export type Profile = { user_id: string; display_name: string };
export type FlowerCollection = { id: string; user_id: string; species: string; collected_at: string };
export type GardenState = { user_id: string; seeds: number[]; flowers: number[]; growing_kind: number | null; growing_seconds: number; awarded_milestones: number };
export const EMPTY_GARDEN: GardenState = { user_id: '', seeds: [0, 0, 0, 0, 0], flowers: [], growing_kind: null, growing_seconds: 0, awarded_milestones: 0 };
export function clock(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`; }
