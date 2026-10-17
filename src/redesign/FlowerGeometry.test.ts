import { expect, it } from 'vitest';
import { flowerGeometry } from './FlowerGeometry';

it('builds complete finite geometry for every species and growth stage', () => {
  for (let kind=0;kind<5;kind++) for (const growth of [0,.15,.35,.75,1]) {
    const parts = flowerGeometry(kind,growth);
    expect(parts).toHaveLength(4);
    for (const geometry of parts) {
      expect(geometry).toBeTruthy();
      expect(Array.from(geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
      expect(geometry.getAttribute('normal').count).toBe(geometry.getAttribute('position').count);
      geometry.dispose();
    }
  }
});

it('keeps petals and flower centers absent until bloom, with a closed bud before it', () => {
  for(let kind=0;kind<5;kind++) for(const progress of [.15,.35,.75,1]) {
    const parts=flowerGeometry(kind,progress);
    expect(parts[3].getAttribute('position').count>0).toBe(progress===1);
    expect(parts[2].getAttribute('position').count>0).toBe(progress>=.75);
    parts.forEach(p=>p.dispose());
  }
});
