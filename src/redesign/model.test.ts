import { describe, expect, it } from 'vitest';
import { seedGarden, tickLocal, plantSeed, demoFlowers, bloomSeconds, gardenGrowth, secondsForFlowers, flowerStage, calmClock, finishLocal, freshSave, validSave } from './model';
describe('quiet timer and persistent local garden', () => {
  it('switches from minutes/seconds to hours/minutes at one hour', () => {
    expect(calmClock(3599)).toEqual({ text: '59:59', unit: '分钟 / 秒钟' });
    expect(calmClock(3600)).toEqual({ text: '01:00', unit: '小时 / 分钟' });
    expect(calmClock(3661).text).toBe('01:01');
    expect(calmClock(43200).text).toBe('12:00');
  });
  it('restores elapsed time from the original start and counts a stop only once', () => {
    const save = { ...freshSave, total: 570, started: 100000 };
    const stopped = finishLocal(save, 190000);
    expect(stopped.total).toBe(660);
    expect(stopped.started).toBeNull();
    expect(finishLocal(stopped, 200000).total).toBe(660);
    expect(gardenGrowth(stopped.total).count).toBe(0);
    expect(gardenGrowth(stopped.total).activeSeconds).toBe(660);
  });
  it('bounds abandoned sessions and backwards clocks', () => {
    expect(finishLocal({ ...freshSave, started: 1000 }, 999999999).total).toBe(43200);
    expect(finishLocal({ ...freshSave, started: 1000 }, 500).total).toBe(0);
  });
  it('rejects malformed imports without accepting negative or non-finite time', () => {
    expect(validSave(freshSave)).toBe(true);
    for (const bad of [null, {}, { ...freshSave, total: -1 }, { ...freshSave, total: Infinity }, { ...freshSave, color: 'red' }, { ...freshSave, started: Date.now() + 999999 }]) expect(validSave(bad)).toBe(false);
  });
});

it('converts reference days to minutes and carries excess into the next flower', () => {
  expect(bloomSeconds(2)).toBe(700 * 60);
  expect(gardenGrowth(bloomSeconds(0)-1).count).toBe(0);
  expect(gardenGrowth(bloomSeconds(0))).toEqual({count:1,activeSeconds:0,progress:0});
  expect(gardenGrowth(secondsForFlowers(7)+123)).toEqual({count:7,activeSeconds:123,progress:123/bloomSeconds(7)});
  expect(gardenGrowth(secondsForFlowers(30)).count).toBe(30);
});
it('uses five stages with bloom only at completion', () => {
  expect([0,.149,.15,.349,.35,.749,.75,.999,1].map(flowerStage)).toEqual([0,0,1,1,2,2,3,3,4]);
});

describe('seed loop', () => {
  const begin = () => ({...freshSave,started:1000});
  it('drops once per full hour of one outing, survives reload, and never rerolls', () => {
    expect(seedGarden(tickLocal(begin(),3600000)).seeds.reduce((a,b)=>a+b,0)).toBe(0);
    const first=tickLocal(begin(),3601000);
    expect(seedGarden(first).seeds.reduce((a,b)=>a+b,0)).toBe(1);
    expect(tickLocal(JSON.parse(JSON.stringify(first)),3601000)).toEqual(first);
    const stopped=finishLocal(first,7201000);
    expect(seedGarden(stopped).seeds.reduce((a,b)=>a+b,0)).toBe(2);
    expect(finishLocal(stopped,9000000)).toEqual(stopped);
  });
  it('does not combine partial hours across outings', () => {
    const first=finishLocal(begin(),1801000);
    const second=finishLocal({...first,started:2000000},3800000);
    expect(seedGarden(second).seeds.reduce((a,b)=>a+b,0)).toBe(0);
  });
  it('returns one matching seed on maturity and requires planting the next seed', () => {
    const base={...begin(),garden:{seeds:[0,0,0,0,0],flowers:[],growing:{kind:2,seconds:bloomSeconds(2)-10},credited:0}};
    const done=tickLocal(base,11000);
    expect(seedGarden(done)).toMatchObject({seeds:[0,0,1,0,0],flowers:[2],growing:null});
    const idle=tickLocal(done,21000);
    expect(seedGarden(idle).seeds).toEqual([0,0,1,0,0]);
    const planted=plantSeed(idle,2);
    expect(seedGarden(planted)).toMatchObject({seeds:[0,0,0,0,0],growing:{kind:2,seconds:0}});
    expect(plantSeed(planted,2)).toBe(planted);
    expect(seedGarden(tickLocal(planted,31000)).growing?.seconds).toBe(10);
  });
  it('preserves legacy gardens, validates inventory, and keeps demos separate from outdoor time', () => {
    const old={...freshSave,total:secondsForFlowers(3)+60};
    expect(seedGarden(old)).toMatchObject({flowers:[0,1,2],seeds:[1,1,1,0,0],growing:{kind:3,seconds:60}});
    expect(validSave({...old,garden:seedGarden(old)})).toBe(true);
    expect(validSave({...old,garden:{...seedGarden(old),seeds:[-1,0,0,0,0]}})).toBe(false);
    expect(demoFlowers(old).total).toBe(old.total);
    expect(seedGarden(demoFlowers(old)).flowers).toHaveLength(30);
  });
});
