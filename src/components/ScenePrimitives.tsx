import { usePortal } from '../cms/PortalContext';
import { MeshStandardMaterial, SphereGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export type Vec3 = [number, number, number];
const rounded = new RoundedBoxGeometry(1, 1, 1, 2, .045);
const sphere = new SphereGeometry(1, 16, 12);
const materials = new Map<string, MeshStandardMaterial>();
function material(color: string, metal = false) {
  const key = color + metal;
  if (!materials.has(key)) materials.set(key, new MeshStandardMaterial({ color, roughness: metal ? .3 : .72, metalness: metal ? .65 : 0 }));
  return materials.get(key)!;
}
export function Block({ at, size, color, rotation, metal = false }: { at: Vec3; size: Vec3; color: string; rotation?: Vec3; metal?: boolean }) {
  const {theme}=usePortal();
  if(theme.accent!=='#f6b74e'&&['#edb94c','#ebbd5f','#e1b25b','#cc9b45','#e8b85c','#f4bd55'].includes(color))color=theme.accent;
  return <mesh position={at} scale={size} rotation={rotation} geometry={rounded} material={material(color, metal)} castShadow receiveShadow dispose={null}/>;
}
export function Ball({ at, size, color }: { at: Vec3; size: Vec3; color: string }) {
  const {theme}=usePortal();
  if(theme.accent!=='#f6b74e'&&['#edb94c','#ebbd5f','#e1b25b','#cc9b45','#e8b85c','#f4bd55'].includes(color))color=theme.accent;
  return <mesh position={at} scale={size} geometry={sphere} material={material(color)} castShadow receiveShadow dispose={null}/>;
}
