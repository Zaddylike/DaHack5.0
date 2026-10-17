import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createMeadow, flowerPositions, plantable, terrainHeight } from './Meadow';

describe('natural garden placement', () => {
  it('keeps the house and entrance path free of flowers', () => {
    const plants = flowerPositions(100);
    expect(plants.length).toBe(100);
    expect(plants.every(p => plantable(p.x,p.z))).toBe(true);
    expect(plantable(-.4,-.5)).toBe(false);
    expect(plantable(-.05,.98)).toBe(false);
    for (const p of plants) expect(terrainHeight(p.x,p.z)).toBeGreaterThanOrEqual(.1);
  });
  it('does not move existing flowers when a new flower blooms', () => {
    expect(flowerPositions(2)).toEqual([{ x: 1.5, z: 1.8 }, { x: 2.25, z: .7 }]);
    expect(flowerPositions(31).slice(0,30)).toEqual(flowerPositions(30));
    expect(flowerPositions(0)).toEqual([]);
    expect(flowerPositions(1000)).toHaveLength(100);
  });
  it('batches the grass and disposes the scene additions', () => {
    const scene = new THREE.Scene(); const meadow = createMeadow(scene);
    expect(meadow.bladeCount).toBeGreaterThan(1000);
    expect(scene.children.filter(c => c instanceof THREE.InstancedMesh)).toHaveLength(1);
    meadow.update(2); meadow.dispose(); expect(scene.children).toHaveLength(0);
  });
  it('opens space in the grass around planted flowers', () => {
    const scene = new THREE.Scene();
    const full = createMeadow(scene); const fullCount = full.bladeCount; full.dispose();
    const planted = createMeadow(scene, flowerPositions(2));
    expect(planted.bladeCount).toBeLessThan(fullCount);
    planted.dispose();
  });
});
