import { BLOOM_SECONDS, STAGE_SECONDS } from '../lib/growth';

// Botanical reference times are educational only; the game uses completed break seconds.
export const growthReferences = [
  { days: 60, range: '55–60', source: 'https://www.johnnyseeds.com/flowers/poppy/california-poppy-flower-seed-1229.html' },
  { days: 112, range: '91–133 · Bellissima', source: 'https://www.panamseed.com/utility/CultureSheetPDF.aspx?pagename=culture.aspx&txtphid=009703371&type=Per' },
  { days: 70, range: '65–75', source: 'https://www.johnnyseeds.com/flowers/centaurea-bachelors-button/florist-blue-boy-centaurea-seed-1017.html' },
  { days: 60, range: '55–65', source: 'https://www.johnnyseeds.com/flowers/poppy/corn-poppy-flower-seed-1611.11.html' },
  { days: 90, range: '75–90 · Sensation', source: 'https://www.johnnyseeds.com/flowers/cosmos/sensation-mix-cosmos-seed-1090.11.html' },
] as const;
// Stage proportions provide visual pacing, not botanical predictions.
export const growthStages = [
  { at: STAGE_SECONDS[0] / BLOOM_SECONDS, zh: '种子', en: 'Seed' }, { at: STAGE_SECONDS[1] / BLOOM_SECONDS, zh: '嫩芽', en: 'Sprout' },
  { at: STAGE_SECONDS[2] / BLOOM_SECONDS, zh: '幼苗', en: 'Seedling' }, { at: STAGE_SECONDS[3] / BLOOM_SECONDS, zh: '花苞', en: 'Bud' },
  { at: 1, zh: '开花', en: 'Bloom' },
] as const;
export function flowerStage(progress: number) {
  let stage = 0;
  for (let i = 1; i < growthStages.length; i++) if (progress >= growthStages[i].at) stage = i;
  return stage;
}
export function bloomSeconds(_kind: number) { return BLOOM_SECONDS; }
const cycleSeconds = growthReferences.reduce((sum, _, i) => sum + bloomSeconds(i), 0);
export function secondsForFlowers(count: number) {
  const n = Math.max(0, Math.floor(count));
  return Math.floor(n / 5) * cycleSeconds + growthReferences.slice(0, n % 5).reduce((sum, _, i) => sum + bloomSeconds(i), 0);
}
export function gardenGrowth(total: number) {
  const safe = Number.isFinite(total) ? Math.max(0, total) : 0;
  let count = Math.floor(safe / cycleSeconds) * 5, activeSeconds = safe % cycleSeconds;
  while (activeSeconds >= bloomSeconds(count)) { activeSeconds -= bloomSeconds(count); count++; }
  return { count, activeSeconds, progress: activeSeconds / bloomSeconds(count) };
}
export const species = [
  { name: '加州罂粟', latin: 'Eschscholzia californica', color: '#eeb454', season: '春 · 夏', note: '像一小片落在草地上的阳光。花瓣在白天展开，傍晚轻轻合拢。' },
  { name: '雏菊', latin: 'Bellis perennis', color: '#f4ebd3', season: '春 · 初夏', note: '小小的白色花瓣围着金黄的花心。普通的日子，也值得认真盛开。' },
  { name: '矢车菊', latin: 'Centaurea cyanus', color: '#8daed4', season: '春 · 夏', note: '细碎的蓝色花瓣，像晴天留在花园里的一点记忆。' },
  { name: '虞美人', latin: 'Papaver rhoeas', color: '#d27b69', season: '春 · 夏', note: '薄薄的花瓣像柔软的纸，细长的花茎随着风轻轻摇动。' },
  { name: '波斯菊', latin: 'Cosmos bipinnatus', color: '#ce9fae', season: '夏 · 秋', note: '轻盈的花朵和细密的叶子，给晚夏的花园留下一点温柔。' },
] as const;
export function calmClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = safe >= 3600;
  const left = hours ? Math.floor(safe / 3600) : Math.floor(safe / 60);
  const right = hours ? Math.floor(safe / 60) % 60 : safe % 60;
  return { text: `${String(Math.min(99, left)).padStart(2, '0')}:${String(right).padStart(2, '0')}`, unit: hours ? '小时 / 分钟' : '分钟 / 秒钟' };
}
export type SeedGarden = { seeds: number[]; flowers: number[]; growing: { kind: number; seconds: number } | null; credited: number };
export type Save = { garden?: SeedGarden; version: 1; name: string; total: number; started: number | null; storySeen: boolean; color: string };
export const freshSave: Save = { version: 1, name: '旅人', total: 0, started: null, storySeen: false, color: 'forest' };
// Previous prototype allowed up to 112 botanical days × 600 game seconds.
const LEGACY_MAX_GROWING_SECONDS = 112 * 600;
export function validSave(value: unknown): value is Save {
  if (!value || typeof value !== 'object') return false;
  const s = value as Save;
  return validGarden(s.garden) && s.version === 1 && typeof s.name === 'string' && s.name.length <= 40 && Number.isFinite(s.total) && s.total >= 0 && s.total <= 3600000 && (s.started === null || Number.isFinite(s.started) && s.started > 0 && s.started <= Date.now()) && typeof s.storySeen === 'boolean' && ['forest', 'blue', 'silver', 'black'].includes(s.color);
}

function validGarden(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const g = value as SeedGarden;
  const kind = (n: number) => Number.isInteger(n) && n >= 0 && n < 5;
  return Array.isArray(g.seeds) && g.seeds.length === 5 && g.seeds.every(n => Number.isInteger(n) && n >= 0 && n <= 100000)
    && Array.isArray(g.flowers) && g.flowers.length <= 10000 && g.flowers.every(kind)
    && Number.isInteger(g.credited) && g.credited >= 0 && g.credited <= 43200
    && (g.growing === null || !!g.growing && kind(g.growing.kind) && Number.isFinite(g.growing.seconds) && g.growing.seconds >= 0 && g.growing.seconds < LEGACY_MAX_GROWING_SECONDS);
}
export function seedGarden(save: Save): SeedGarden {
  if (save.garden) {
    const garden = save.garden;
    if (!garden.growing || garden.growing.seconds < BLOOM_SECONDS) return garden;
    const completed = Math.floor(garden.growing.seconds / BLOOM_SECONDS);
    const kind = garden.growing.kind;
    const seeds = [...garden.seeds]; seeds[kind] += completed;
    return { ...garden, seeds, flowers: [...garden.flowers, ...Array(completed).fill(kind)],
      growing: garden.growing.seconds % BLOOM_SECONDS ? { kind, seconds: garden.growing.seconds % BLOOM_SECONDS } : null };
  }
  const old = gardenGrowth(save.total);
  const flowers = Array.from({length: old.count}, (_, i) => i % 5);
  const seeds = [0,0,0,0,0]; flowers.forEach(kind => seeds[kind]++);
  // Preserve existing plants; historical session hours are unknown, so do not invent drops.
  return { seeds, flowers, growing: {kind: old.count % 5, seconds: old.activeSeconds}, credited: 0 };
}
export function plantSeed(save: Save, kind: number): Save {
  const garden = seedGarden(save);
  if (garden.growing || !Number.isInteger(kind) || kind < 0 || kind > 4 || garden.seeds[kind] < 1) return save;
  const seeds = [...garden.seeds]; seeds[kind]--;
  return {...save, garden: {...garden, seeds, growing: {kind, seconds:0}}};
}
// Stable pseudo-random selection per session/hour avoids rerolling on refresh or React retries.
function hourlyKind(start: number, hour: number) {
  let n = ((start % 4294967296) ^ Math.imul(hour, 0x9e3779b9)) >>> 0;
  n = Math.imul(n ^ n >>> 16, 0x21f0aaad); n = Math.imul(n ^ n >>> 15, 0x735a2d97);
  return ((n ^ n >>> 15) >>> 0) % 5;
}
export function tickLocal(save: Save, now = Date.now()): Save {
  if (save.started === null) return save;
  const garden = seedGarden(save);
  const elapsed = Math.min(43200, Math.max(0, Math.floor((now-save.started)/1000)));
  if (elapsed <= garden.credited) return save.garden ? save : {...save, garden};
  const delta = elapsed-garden.credited, seeds = [...garden.seeds];
  let flowers = garden.flowers;
  for (let hour = Math.floor(garden.credited/3600)+1; hour <= Math.floor(elapsed/3600); hour++) seeds[hourlyKind(save.started,hour)]++;
  let growing = garden.growing;
  if (growing) {
    const seconds = growing.seconds + delta;
    if (seconds >= bloomSeconds(growing.kind)) { flowers = [...flowers,growing.kind]; seeds[growing.kind]++; growing = null; }
    else growing = {...growing, seconds};
  }
  return {...save, total: Math.min(3600000,save.total+delta), garden: {seeds,flowers,growing,credited:elapsed}};
}
export function finishLocal(save: Save, now = Date.now()): Save {
  if (save.started === null) return save;
  const next = tickLocal(save,now);
  return {...next,started:null,garden:{...seedGarden(next),credited:0}};
}
export function demoFlowers(save: Save): Save {
  const garden = seedGarden(save), flowers = [...garden.flowers];
  while(flowers.length < 30) flowers.push(flowers.length % 5);
  return {...save,garden:{...garden,flowers}};
}
