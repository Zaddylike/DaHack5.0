export const STAGES = ['Seed', 'Sprout', 'Seedling', 'Bud', 'Bloom'] as const;
export const STAGE_SECONDS = [0, 120, 300, 420, 600] as const;
export const BLOOM_SECONDS = STAGE_SECONDS[4];
export function getGrowth(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const ratio = Math.min(1, safeSeconds / BLOOM_SECONDS);
  const stageIndex = STAGE_SECONDS.filter(seconds => safeSeconds >= seconds).length - 1;
  const next = STAGE_SECONDS[stageIndex + 1];
  const current = STAGE_SECONDS[stageIndex];
  return { stage: STAGES[stageIndex], stageIndex, percent: ratio * 100, isBloom: ratio === 1,
    nextStagePercent: next === undefined ? 100 : Math.min(100, (safeSeconds - current) / (next - current) * 100),
    secondsToNextStage: next === undefined ? 0 : Math.ceil(Math.max(0, next - safeSeconds)) };
}
