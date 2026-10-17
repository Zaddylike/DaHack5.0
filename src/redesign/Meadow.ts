import * as THREE from 'three';

export function terrainHeight(x: number, z: number) {
  const distance = Math.hypot((x + .4) / 1.5, (z + .5) / 1.25);
  const edge = Math.min(1, Math.max(0, distance - .9));
  const height = .15 + edge * (.045 + Math.sin(x * 1.8 + z) * .045 + Math.cos(z * 2.3) * .025);
  const angle = Math.atan2(z / 3.25, x / 4.05);
  const radius = Math.hypot(x / 4.05, z / 3.25) / (1 + Math.sin(angle * 5) * .025 + Math.cos(angle * 3) * .035);
  const rim = Math.min(1, Math.max(0, (radius - .84) / .16));
  return height + (.1 - height) * rim;
}
export function plantable(x: number, z: number) {
  if (Math.hypot(x / 3.9, z / 3.1) > .96) return false;
  if (x > -1.55 && x < .80 && z > -1.55 && z < .61) return false;
  if (z > .42 && Math.abs(x - (-.05 + Math.sin((z - .98) / .36 * .8) * .16)) < .34) return false;
  return true;
}
function random(seed: number) { let state = seed >>> 0; return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; }; }
export function flowerPositions(count: number) {
  const rng = random(713), positions: { x: number; z: number }[] = [];
  // The first flowers anchor the foreground, where the house cannot hide them.
  for (const position of [{ x: 2.2, z: 2.1 }, { x: 2.6, z: .5 }]) {
    if (positions.length < Math.min(100, count)) positions.push(position);
  }
  for (let attempt = 0; positions.length < Math.min(100, count) && attempt < 10000; attempt++) {
    const x = (rng() - .5) * 7.5, z = (rng() - .5) * 6.0;
    if (plantable(x, z) && positions.every(p => Math.hypot(p.x - x, p.z - z) > .36)) positions.push({ x, z });
  }
  return positions;
}
export function createMeadow(scene: THREE.Scene, flowers: ReadonlyArray<{ x: number; z: number }> = []) {
  const disposables: { dispose: () => void }[] = [], rng = random(257), color = new THREE.Color();
  const segments = 64, rings = 16, positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const moss = new THREE.Color('#819b5a'), light = new THREE.Color('#a6b578');
  for (let r = 0; r <= rings; r++) for (let s = 0; s <= segments; s++) {
    const angle = s / segments * Math.PI * 2, radius = r / rings;
    const wobble = 1 + Math.sin(angle * 5) * .025 + Math.cos(angle * 3) * .035;
    const x = Math.cos(angle) * 4.05 * radius * wobble, z = Math.sin(angle) * 3.25 * radius * wobble;
    positions.push(x, terrainHeight(x, z), z);
    color.copy(moss).lerp(light, .5 + Math.sin(x * 1.5 + z * .8) * .25 + Math.cos(z * 1.4) * .15); colors.push(color.r, color.g, color.b);
    if (r < rings && s < segments) { const a = r * (segments + 1) + s, b = a + segments + 1; indices.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  const groundGeo = new THREE.BufferGeometry(); groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); groundGeo.setIndex(indices); groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide });
  const ground = new THREE.Mesh(groundGeo, groundMat); ground.receiveShadow = true; scene.add(ground); disposables.push(groundGeo, groundMat);
  const edgeShape = new THREE.Shape();
  for (let s = 0; s <= segments; s++) { const a = s / segments * Math.PI * 2, w = 1 + Math.sin(a * 5) * .025 + Math.cos(a * 3) * .035; const x = Math.cos(a) * 4.05 * w, y = Math.sin(a) * 3.25 * w; if (!s) edgeShape.moveTo(x, y); else edgeShape.lineTo(x, y); }
  const edgeGeo = new THREE.ExtrudeGeometry(edgeShape, { depth: .13, bevelEnabled: true, bevelSegments: 2, bevelSize: .04, bevelThickness: .02, steps: 1 }); edgeGeo.rotateX(-Math.PI / 2);
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#8a9167', roughness: 1 }); const edge = new THREE.Mesh(edgeGeo, edgeMat); edge.position.y = -.05; edge.receiveShadow = true; edge.castShadow = true; scene.add(edge); disposables.push(edgeGeo, edgeMat);
  // Tapered blades share one mesh and one shader; no grass textures or alpha sorting.
  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,-.035,.34,.018,.035,.34,.018,-.022,.7,.055,.022,.7,.055,0,1,.12], 3));
  bladeGeo.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]); bladeGeo.computeVertexNormals();
  bladeGeo.setAttribute('color', new THREE.Float32BufferAttribute([.64,.72,.51,.64,.72,.51,.78,.85,.61,.78,.85,.61,.94,.97,.78,.94,.97,.78,1,1,.88],3));
  const gradient = new THREE.DataTexture(new Uint8Array([100,165,215,255]),4,1,THREE.RedFormat); gradient.minFilter = THREE.NearestFilter; gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
  const grassMat = new THREE.MeshToonMaterial({ color: '#a0b676', vertexColors: true, gradientMap: gradient, side: THREE.DoubleSide });
  const wind = { value: 0 };
  grassMat.onBeforeCompile = shader => {
    shader.uniforms.meadowTime = wind; shader.vertexShader = 'uniform float meadowTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float phase = instanceMatrix[3].x * 1.4 + instanceMatrix[3].z * .8;
      float gust = sin(meadowTime * 1.25 + phase) * .17 + sin(meadowTime * 2.1 + phase * 2.3) * .05;
      transformed.x += gust * position.y * position.y;
      transformed.z += cos(meadowTime + phase) * .08 * position.y * position.y;`);
  };
  const candidates: { x:number; z:number; height:number; rotation:number }[] = [];
  for (let i = 0; i < 10000; i++) {
    const x = (rng() - .5) * 7.9, z = (rng() - .5) * 6.3;
    if (!plantable(x,z)) continue;
    const nearestFlower = flowers.reduce((nearest, flower) => Math.min(nearest, Math.hypot(x - flower.x, z - flower.z)), Infinity);
    if (nearestFlower < .22) continue;
    const clearingEdge = Math.min(1, (nearestFlower - .22) / .2);
    const density = .55 + Math.sin(x * 3 + z * 1.4) * .20 + Math.cos(z * 3.1 - x) * .18;
    if (rng() > density * (.5 + .5 * clearingEdge)) continue;
    candidates.push({ x,z,height:(.12 + rng() * .17 + Math.max(0,Math.sin(x*2-z))*.07) * .72 * (.4 + .6 * clearingEdge), rotation:rng()*Math.PI*2 });
  }
  const grass = new THREE.InstancedMesh(bladeGeo,grassMat,candidates.length); grass.receiveShadow = true; grass.castShadow = false;
  const dummy = new THREE.Object3D(), darkGrass = new THREE.Color('#688b48'), sunGrass = new THREE.Color('#a9bb6e');
  candidates.forEach((blade,i) => { dummy.position.set(blade.x,terrainHeight(blade.x,blade.z),blade.z); dummy.rotation.set(0,blade.rotation,0); dummy.scale.set(.6+ rng()*.4,blade.height,.6); dummy.updateMatrix(); grass.setMatrixAt(i,dummy.matrix); color.copy(darkGrass).lerp(sunGrass,rng()); grass.setColorAt(i,color); });
  grass.instanceMatrix.needsUpdate = true; if (grass.instanceColor) grass.instanceColor.needsUpdate = true; scene.add(grass); disposables.push(grass,bladeGeo,grassMat,gradient);
  return { bladeCount: candidates.length, update: (time:number) => { wind.value=time; }, dispose: () => { scene.remove(ground,edge,grass); disposables.forEach(item => item.dispose()); } };
}
