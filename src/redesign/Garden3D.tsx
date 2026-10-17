import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { flowerGeometry } from './FlowerGeometry';
import { flowerStage } from './model';
import { createMeadow, flowerPositions, terrainHeight } from './Meadow';

type Props = { count: number; progress: number; selected: number | null; lastFlower: number; onSelect: (id: number | null) => void; label: string; fallback: string; kindOverride?: number; flowerKinds?: number[]; activeKind?: number };
const petals = [0xe0b45c, 0xf1eedc, 0x7e9dc5, 0xcb8068, 0xcba2b5];

export default function Garden3D({ count, progress, selected, lastFlower, onSelect, label, fallback, kindOverride, flowerKinds, activeKind }: Props) {
  const host = useRef<HTMLDivElement>(null), callbacks = useRef({ onSelect }); callbacks.current = { onSelect };
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const node = host.current!; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { setFailed(true); return; }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    node.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 80);
    const detail = selected !== null;
    camera.position.set(detail ? 3 : 8, detail ? 2.3 : 7.5, detail ? 4 : 10);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, detail ? .7 : .7, 0);
    controls.enablePan = false; controls.enableDamping = false;
    controls.minPolarAngle = .35; controls.maxPolarAngle = Math.PI / 2.3;
    controls.minZoom = detail ? .65 : .8; controls.maxZoom = detail ? 2 : 1.8;
    controls.rotateSpeed = .55; controls.zoomSpeed = .65;
    controls.update();
    const ambient = new THREE.HemisphereLight(0xe5f2ff, 0x809663, 1.8); scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff1ce, 3.1); sun.position.set(-4, 9, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.camera.near = .5; sun.shadow.camera.far = 25; sun.shadow.normalBias = .018; sun.shadow.bias = -.00015; sun.shadow.radius = 3;
    scene.add(sun);
    const materials: THREE.Material[] = [], geometries: THREE.BufferGeometry[] = [];
    const bandMap = new THREE.DataTexture(new Uint8Array([105, 170, 220, 255]), 4, 1, THREE.RedFormat);
    bandMap.minFilter = THREE.NearestFilter; bandMap.magFilter = THREE.NearestFilter; bandMap.needsUpdate = true;
    const wind = { value: 0 };
    function botanicalMaterial(color: number, sway = false) {
      const m = new THREE.MeshToonMaterial({ color, gradientMap: bandMap, side: THREE.DoubleSide }); materials.push(m);
      if (sway) m.onBeforeCompile = shader => {
        shader.uniforms.flowerTime = wind; shader.vertexShader = 'uniform float flowerTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          float phase = instanceMatrix[3].x * 1.4 + instanceMatrix[3].z * .8;
          transformed.x += sin(flowerTime * 1.25 + phase) * .045 * position.y * position.y;
          transformed.z += cos(flowerTime + phase) * .025 * position.y * position.y;`);
      };
      return m;
    }
    function material(color: number, roughness = .85, metalness = 0) { const m = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(m); return m; }
    const chalk = material(0xe6e2d5), roof = material(0x52665c, .68, .12), roofEdge = material(0x3c5148), timber = material(0xa2967c), glass = material(0x384f4c, .18, .3), stone = material(0xd5d0be), green = botanicalMaterial(0x8ba462);
    function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) { geometries.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
    function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, radius = .015) { return mesh(new RoundedBoxGeometry(w, h, d, 2, radius), mat, x, y, z); }
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x465347, opacity: .13 }));
    shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = -.16; shadowPlane.receiveShadow = true; scene.add(shadowPlane);
    geometries.push(shadowPlane.geometry); materials.push(shadowPlane.material);
    const gardenPositions = !detail ? flowerPositions(count + (lastFlower === count ? 1 : 0)) : [];
    const meadow = !detail ? createMeadow(scene, gardenPositions) : null;
    if (!detail) {
      // Limestone dwelling, dark standing-seam roof, recessed glazing and timber door.
      box(2.15, .14, 1.95, stone, -.4, .23, -.45, .035);
      box(1.9, 1.38, 1.65, chalk, -.4, .97, -.5, .025);
      const gable = new THREE.Shape(); gable.moveTo(-.95, 0); gable.lineTo(0, .76); gable.lineTo(.95, 0); gable.closePath();
      mesh(new THREE.ExtrudeGeometry(gable, { depth: 1.65, bevelEnabled: false }), chalk, -.4, 1.66, -1.325);
      const roofAngle = Math.atan2(.82, 1.08);
      for (const side of [-1, 1]) {
        const panel = box(1.36, .065, 1.99, roof, -.4 + side * .53, 2.08, -.5, .008); panel.rotation.z = -side * roofAngle;
        for (let i = 0; i < 9; i++) { const seam = box(1.36, .022, .012, roofEdge, -.4 + side * .53, 2.122, -1.43 + i * .23, .002); seam.rotation.z = -side * roofAngle; }
      }
      box(.32, .85, .32, chalk, -.93, 2.03, -.93, .015); box(.39, .07, .39, stone, -.93, 2.47, -.93, .01);
      box(.38, .88, .04, roofEdge, -.05, .75, .342); box(.31, .80, .045, timber, -.05, .73, .369);
      for (let i = 0; i < 5; i++) box(.008, .78, .013, stone, -.17 + i * .06, .73, .398, .002);
      box(.023, .10, .026, roofEdge, .04, .75, .411, .003);
      box(.53, .49, .07, stone, -.91, 1.13, .36); box(.44, .40, .075, glass, -.91, 1.13, .39);
      box(.018, .40, .02, timber, -.91, 1.13, .435, .002);
      box(.075, .43, .70, glass, .565, 1.12, -.66); box(.095, .035, .77, stone, .57, .89, -.66);
      box(.50, .10, .23, stone, -.05, .24, .55);
      for (let i = 0; i < 5; i++) { const x = -.05 + Math.sin(i * .8) * .16, z = .98 + i * .36; const p = box(.48, .055, .31, stone, x, terrainHeight(x,z) + .025, z, .025); p.rotation.y = Math.sin(i) * .12; }
      // Two restrained sculptural trees, with actual branch and foliage shadows.
      for (const [x, z, scale] of [[-2.3, -1.3, 1], [2.15, -1.65, .72]]) {
        mesh(new THREE.CylinderGeometry(.027, .045, 1.45 * scale, 8), timber, x, .85 * scale, z);
        const foliage = mesh(new THREE.IcosahedronGeometry(.65, 2), green, x, 1.8 * scale, z); foliage.scale.set(.9 * scale, .75 * scale, .85 * scale);
        const second = mesh(new THREE.IcosahedronGeometry(.48, 2), botanicalMaterial(0xa3b779), x + .30 * scale, 1.5 * scale, z + .05); second.scale.set(.8 * scale, .9 * scale, .75 * scale);
        const third = mesh(new THREE.IcosahedronGeometry(.42, 2), botanicalMaterial(0x789650), x - .30 * scale, 1.5 * scale, z + .1); third.scale.set(scale, .8 * scale, .85 * scale);
      }
      // Small stones anchor the planting to the terrain.
      for (let i = 0; i < 10; i++) { const angle = i * 2.4, r = 2.25, x = Math.cos(angle)*r, z = Math.sin(angle)*r*.8; const rock = mesh(new THREE.DodecahedronGeometry(.07 + i % 3 * .025), stone, x, terrainHeight(x,z), z); rock.scale.y = .5; }
    } else { const bed = mesh(new THREE.CylinderGeometry(.49, .52, .04, 48), material(0xe2e1d5), 0, -.02, 0); bed.receiveShadow = true; }
    const pickables: THREE.InstancedMesh[] = [];
    type Plant = { id: number; kind: number; x: number; z: number; scale: number; progress: number };
    const plants: Plant[] = [];
    if (detail) plants.push({ id: selected!, kind: kindOverride ?? (selected! < count ? flowerKinds?.[selected!] : activeKind) ?? selected! % 5, x: 0, z: 0, scale: 1.1, progress: selected! < count ? 1 : progress });
    else {
      gardenPositions.slice(0, count).forEach(({ x,z }, i) => plants.push({ id: i, kind: flowerKinds?.[i] ?? i % 5, x, z, scale: i < 2 ? 1.3 : i < 5 ? .9 : .56, progress: 1 }));
      if (lastFlower === count) { const { x, z } = gardenPositions[count]; plants.push({ id: count, kind: activeKind ?? count % 5, x, z, scale: count < 2 ? 1.3 : count < 5 ? .9 : .58, progress }); }
    }
    const batches = new Map<string, Plant[]>();
    for (const plant of plants) { const key = `${plant.kind}-${plant.progress}`; batches.set(key, [...(batches.get(key) ?? []), plant]); }
    const matrix = new THREE.Object3D();
    for (const items of batches.values()) {
      const { kind, progress: growth } = items[0]; const parts = flowerGeometry(kind, growth); geometries.push(...parts);
      const mats = [botanicalMaterial(0x637d41,true), botanicalMaterial(0x829b58,true), botanicalMaterial(flowerStage(growth) === 0 ? 0x796047 : flowerStage(growth) < 4 ? 0x789351 : petals[kind],true), botanicalMaterial(flowerStage(growth) === 0 ? 0xb19a72 : kind === 3 ? 0x59523c : 0xb59b56,true)];
      parts.forEach((geometry, part) => {
        if (!geometry.getAttribute('position').count) return;
        const inst = new THREE.InstancedMesh(geometry, mats[part], items.length); inst.castShadow = true; inst.receiveShadow = true;
        inst.userData.flowerIds = items.map(p => p.id);
        items.forEach((plant, index) => { matrix.position.set(plant.x, detail ? .01 : terrainHeight(plant.x,plant.z), plant.z); matrix.rotation.set(0, plant.id * .8, 0); matrix.scale.setScalar(plant.scale); matrix.updateMatrix(); inst.setMatrixAt(index, matrix.matrix); });
        inst.instanceMatrix.needsUpdate = true; scene.add(inst); pickables.push(inst);
      });
    }
    let disposed = false, frame = 0, selectedByZoom = false;
    function render() { if (disposed || frame) return; frame = requestAnimationFrame(() => { frame = 0; if (!disposed) renderer.render(scene, camera); }); }
    function resize() { const width = node.clientWidth, height = node.clientHeight; if (!width || !height) return; renderer.setSize(width, height); const aspect = width / height; const span = detail ? Math.max(2.5, 2.2 * aspect) : Math.max(width < 600 ? 10.4 : 9.8, 7.4 * aspect); camera.left = -span / 2; camera.right = span / 2; camera.top = span / aspect / 2; camera.bottom = -span / aspect / 2; camera.updateProjectionMatrix(); render(); }
    const observer = new ResizeObserver(resize); observer.observe(node); resize();
    // Wind is capped at 30 fps, paused offscreen/in background, and respects reduced motion.
    let windFrame = 0, previousTime = 0, visible = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function animate(time: number) {
      windFrame = 0;
      if (disposed || document.hidden || !visible || reducedMotion.matches) return;
      if (time - previousTime > 33) { wind.value = time / 1000; meadow?.update(time / 1000); render(); previousTime = time; }
      windFrame = requestAnimationFrame(animate);
    }
    function resume() { cancelAnimationFrame(windFrame); windFrame = 0; if (!document.hidden && visible && !reducedMotion.matches) windFrame = requestAnimationFrame(animate); else render(); }
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }); visibility.observe(node);
    document.addEventListener('visibilitychange', resume); reducedMotion.addEventListener('change', resume); resume();
    function changed() { render(); if (selectedByZoom) return; if (!detail && lastFlower >= 0 && camera.zoom > 1.7) { selectedByZoom = true; callbacks.current.onSelect(lastFlower); } else if (detail && camera.zoom < .75) { selectedByZoom = true; callbacks.current.onSelect(null); } }
    controls.addEventListener('change', changed);
    let pointerStart = { x: 0, y: 0 }; let pointerCount = 0; let moved = false;
    const down = (e: PointerEvent) => { pointerCount++; moved = pointerCount > 1; pointerStart = { x: e.clientX, y: e.clientY }; };
    const move = (e: PointerEvent) => { if (Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 7) moved = true; };
    const up = (e: PointerEvent) => { pointerCount = Math.max(0, pointerCount - 1); if (detail || moved) return; const rect = renderer.domElement.getBoundingClientRect(); const ray = new THREE.Raycaster(); ray.params.Mesh = {}; ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera); const hit = ray.intersectObjects(pickables)[0]; if (hit && hit.instanceId !== undefined) callbacks.current.onSelect(hit.object.userData.flowerIds[hit.instanceId]); };
    renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('pointerup', up);
    const cancel = () => { pointerCount = 0; moved = true; }; renderer.domElement.addEventListener('pointercancel', cancel);
    const lost = (e: Event) => { e.preventDefault(); setFailed(true); }; renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => { disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(windFrame); visibility.disconnect(); document.removeEventListener('visibilitychange',resume); reducedMotion.removeEventListener('change',resume); meadow?.dispose(); bandMap.dispose(); observer.disconnect(); controls.dispose(); renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', cancel); renderer.domElement.removeEventListener('webglcontextlost', lost); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); pickables.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, [count, progress, selected, lastFlower, kindOverride, flowerKinds, activeKind]);
  return <div ref={host} className={`garden-3d ${selected !== null ? 'specimen-3d' : ''}`} role="img" aria-label={label}>{failed && <div className="webgl-fallback"><span>{fallback}</span><button onClick={() => callbacks.current.onSelect(selected === null ? lastFlower : null)}>{selected === null ? '↗' : '←'}</button></div>}</div>;
}
