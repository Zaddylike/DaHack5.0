import * as THREE from 'three';
import { flowerStage } from './model';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Thin curved surfaces, rather than flattened spheres, keep petals light in silhouette.
function petal(length: number, width: number, cup: number, kind: number, variation = 0) {
  const points: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 12, columns = 8;
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
    const t = i / rows, u = j / columns, across = u * 2 - 1; uv.push(u,t);
    const outline = Math.pow(Math.sin(Math.PI * t), kind === 1 ? .42 : .65);
    const ruffle = kind === 0 || kind === 3 ? Math.sin(u * Math.PI * 7 + variation) * .012 * t * t * t : 0;
    const notch = kind === 2 ? .10 * Math.cos(u * Math.PI * 6) * Math.pow(t, 5) : kind === 4 ? -.08 * Math.sin(u * Math.PI) * Math.pow(t, 6) : 0;
    points.push(across * width * outline, cup * t * t + .016 * (1 - across * across) * Math.sin(t * Math.PI) + ruffle, .025 + length * t * (1 + notch));
    if (i < rows && j < columns) { const a = i * (columns + 1) + j, b = a + columns + 1; indices.push(a,b,a+1,a+1,b,b+1); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3)); geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function merge(parts: THREE.BufferGeometry[]) {
  if (!parts.length) {
    const empty = new THREE.BufferGeometry();
    empty.setAttribute('position', new THREE.Float32BufferAttribute([],3));
    empty.setAttribute('normal', new THREE.Float32BufferAttribute([],3));
    empty.setAttribute('uv', new THREE.Float32BufferAttribute([],2)); empty.setIndex([]); return empty;
  }
  const result = mergeGeometries(parts)!; parts.forEach(p => p.dispose()); return result;
}
export function flowerGeometry(kind: number, progress = 1) {
  const stage = flowerStage(progress);
  const stems: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [], head: THREE.BufferGeometry[] = [];
  if (stage === 0) {
    // A partly buried seed with a pale longitudinal seam.
    head.push(new THREE.SphereGeometry(1,16,10).scale(.058,.038,.095).translate(0,.018,0));
    const seam = new THREE.TorusGeometry(.052,.003,4,24,Math.PI);
    seam.rotateY(Math.PI/2); seam.scale(1, .55,1.65); seam.translate(0,.018,0);
    return [merge([]),merge([]),merge(head),seam];
  }
  const height = stage === 1 ? .16 + (progress-.15)*.45 : stage === 2 ? (kind === 1 ? .23 : .48) + (progress-.35)*.4 : (kind === 1 ? .9 : 1.25);
  const bend = kind === 3 && stage === 3 ? .12 : .025;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.025,height*.38,.01),new THREE.Vector3(bend,height*.8,-.015),new THREE.Vector3(0,height,0)]);
  stems.push(new THREE.TubeGeometry(curve,16,stage === 1 ? .009 : .012,6,false));
  if (stage === 1) {
    for (let i=0;i<2;i++) { const leaf=petal(.12,.043,.025,1); leaf.rotateX(-.2);leaf.rotateY(i*Math.PI+.4);leaf.translate(0,height*.8,0);leaves.push(leaf); }
  } else {
    const count = kind === 1 ? 7 : 4;
    for (let i=0;i<count;i++) {
      const angle=i*2.39996, y=kind===1 ? .025+i*.008 : height*(.16+i*.14);
      if (kind === 4 || kind === 0 || kind === 3) {
        // Fine divided foliage: cosmos is feathery; poppies have broader lobes.
        for(let j=0;j<5;j++) for(const side of [-1,1]) {
          const leaf=petal((.18-j*.024),kind===4 ? .009 : .025,.025,1);
          leaf.rotateY(side*(.6+j*.07));leaf.translate(0,j*.025,j*.043);leaf.rotateX(-.35);leaf.rotateY(angle);leaf.translate(0,y,0);leaves.push(leaf);
        }
      } else {
        const leaf=petal(kind===1 ? .30 : .29,kind===1 ? .073 : .033,.055,1);
        leaf.rotateX(-.3);leaf.rotateY(angle);leaf.translate(0,y,0);leaves.push(leaf);
      }
    }
  }
  if(stage >= 3) {
    const calyx = new THREE.ConeGeometry(.057,.085,9);calyx.rotateX(Math.PI);calyx.translate(0,height-.025,0);leaves.push(calyx);
  }
  if(stage === 3) {
    // Overlapping closed sepals, with distinct ridges and a pointed tip.
    for(let i=0;i<5;i++) { const sepal=petal(.18,.055,.055,1);sepal.rotateX(-1.32);sepal.rotateY(i*Math.PI*2/5);sepal.translate(0,height-.015,0);leaves.push(sepal); }
    head.push(new THREE.SphereGeometry(1,16,10).scale(.052,.095,.052).translate(0,height+.055,0));
  }
  if(stage < 4) return [merge(stems),merge(leaves),merge(head),merge([])];
  const count = [4,22,15,4,8][kind];
  for (let i = 0; i < count; i++) {
    const length = [.28,.23,.20,.30,.26][kind]*(1+Math.sin(i*4.1)*.055);
    const width = [.19,.029,.046,.205,.098][kind];
    const cup = [.16,.018,.055,.11,.025][kind];
    const p = petal(length,width,cup,kind,i);
    p.rotateZ(Math.sin(i*3.7)*.045);p.rotateY(i*Math.PI*2/count);p.translate(0,height+(kind===1 && i%2 ? -.012 : 0),0);head.push(p);
  }
  const centerParts: THREE.BufferGeometry[] = [];
  const radius = kind === 1 ? .076 : kind === 2 ? .044 : .061;
  centerParts.push(new THREE.SphereGeometry(radius,14,8).scale(1,.48,1).translate(0,height+.02,0));
  const seeds = kind === 1 ? 16 : 11;
  for (let i = 0; i < seeds; i++) {
    const angle = i*2.39996, r = radius * Math.sqrt((i+.5)/seeds)*.88;
    const seed = new THREE.SphereGeometry(kind===1 ? .009 : .007,5,4);
    seed.translate(Math.cos(angle)*r,height+.038+Math.sqrt(Math.max(0,1-r*r/(radius*radius)))*.012,Math.sin(angle)*r); centerParts.push(seed);
  }
  return [merge(stems),merge(leaves),merge(head),merge(centerParts)];
}
