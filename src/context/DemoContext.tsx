import { createContext, useContext, useState, type ReactNode } from 'react';
import { STAGES } from '../lib/growth';
export function useDemoState() { const [enabled, setEnabled] = useState(false); const [stageIndex, setStageIndex] = useState(0); return { enabled, setEnabled, stageIndex, stage: STAGES[stageIndex], next: () => setStageIndex(i => Math.min(4, i + 1)), previous: () => setStageIndex(i => Math.max(0, i - 1)), reset: () => setStageIndex(0) }; }
const Context = createContext<ReturnType<typeof useDemoState> | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) { const state = useDemoState(); return <Context.Provider value={state}>{children}</Context.Provider>; }
export function useDemo() { const state = useContext(Context); if (!state) throw new Error('DemoProvider required'); return state; }
