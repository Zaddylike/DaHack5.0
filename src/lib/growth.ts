export const STAGES = ['Seed', 'Sprout', 'Seedling', 'Bud', 'Bloom'] as const;
export const BLOOM_SECONDS = 12600;
const thresholds = [0, .2, .4, .7, 1];
export function getGrowth(totalSeconds: number) {
  const ratio = Math.min(1, Math.max(0, totalSeconds) / BLOOM_SECONDS);
  const stageIndex = thresholds.filter(t => ratio >= t).length - 1;
  const next = thresholds[stageIndex + 1];
  return { stage: STAGES[stageIndex], stageIndex, percent: ratio * 100, isBloom: ratio === 1,
    nextStagePercent: next === undefined ? 100 : (ratio - thresholds[stageIndex]) / (next - thresholds[stageIndex]) * 100,
    secondsToNextStage: next === undefined ? 0 : Math.ceil(next * BLOOM_SECONDS - Math.max(0, totalSeconds)) };
}
