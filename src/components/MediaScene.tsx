import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CatmullRomCurve3, Group, MathUtils, TubeGeometry, Vector3 } from 'three';
import { Block, Ball, type Vec3 } from './ScenePrimitives';
import { Laptop, Tablet } from './DeviceModels';
import type { MediaKind } from './media-types';

type Control = { rotation: number; expanded: boolean; scroll: number };
interface Props { kind: MediaKind; control: RefObject<Control>; active: boolean; onReady: () => void; onLost: () => void }
function Cable({ end }: { end: Vec3 }) {
  const geometry = useMemo(() => new TubeGeometry(new CatmullRomCurve3([new Vector3(0, .05, 0), new Vector3(end[0] * .5, .05, 0), new Vector3(end[0], .05, end[2])]), 20, .025, 6, false), [end[0], end[2]]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#cc9b45"/></mesh>;
}
function Station({ at }: { at: Vec3 }) {
  return <group position={at}><Block at={[0, .32, 0]} size={[1.45, .64, 1.05]} color="#e9dfc5"/><Block at={[0, .69, 0]} size={[1.55, .1, 1.16]} color="#577359"/>{[-.38, .38].map(x => <Block key={x} at={[x, .37, .535]} size={[.32, .3, .025]} color="#477776"/>)}<Block at={[0, .82, 0]} size={[.35, .12, .22]} color="#d4b878"/></group>;
}
function Network({ expansion }: { expansion: RefObject<Group | null> }) {
  return <group><Block at={[0, -.16, 0]} size={[7.5, .25, 4.8]} color="#dce4cb"/>
    <Block at={[0, .65, -.5]} size={[1.3, 1.5, 1.05]} color="#294b42"/>
    {[.25, .65, 1.05].map(y => <group key={y}><Block at={[0, y, .04]} size={[1.12, .28, .07]} color="#60796c"/><Ball at={[.37, y, .09]} size={[.045, .045, .025]} color="#ebbd5f"/></group>)}
    <Station at={[-2.6, 0, .7]}/><Station at={[2.6, 0, .7]}/><Station at={[0, 0, -1.8]}/>
    <group ref={expansion}><Cable end={[-2.6, 0, .7]}/><Cable end={[2.6, 0, .7]}/><Cable end={[0, 0, -1.8]}/>{[-2.6, 2.6].map(x => <Ball key={x} at={[x, .12, .7]} size={[.1, .1, .1]} color="#edb94c"/>)}</group>
  </group>;
}
function DataPanel({ at }: { at: Vec3 }) {
  return <group position={at}><Block at={[0, 0, 0]} size={[1.5, 1.9, .1]} color="#eee9d6"/><Block at={[0, .6, .07]} size={[1.12, .22, .02]} color="#81a276"/>{[.18, -.12, -.42].map(y => <group key={y}><Block at={[-.42, y, .07]} size={[.12, .12, .02]} color="#c9a25b"/><Block at={[.14, y, .07]} size={[.7, .055, .02]} color="#779080"/></group>)}</group>;
}
function Support({ expansion }: { expansion: RefObject<Group | null> }) {
  return <group><Block at={[0, -.8, 0]} size={[5.6, .18, 3.2]} color="#d7dfc4"/>
    <mesh position={[-.7, 1, 0]}><torusGeometry args={[1.1, .13, 12, 40, Math.PI]}/><meshStandardMaterial color="#385c4e" roughness={.6}/></mesh>
    {[-1.83, .43].map(x => <group key={x}><Block at={[x, .72, 0]} size={[.3, .9, .5]} color="#e1b25b"/><Block at={[x + (x < 0 ? .15 : -.15), .72, 0]} size={[.14, .68, .4]} color="#3a594c"/></group>)}
    <Block at={[.43, .3, .45]} size={[.07, .07, .7]} color="#385c4e"/><Block at={[.19, .3, .8]} size={[.5, .08, .1]} color="#385c4e"/>
    <group ref={expansion}><DataPanel at={[1.75, .8, -.2]}/><Block at={[1.75, -.45, -.2]} size={[1.4, .12, .8]} color="#9bb294"/></group>
  </group>;
}
function Layers({ expansion, middle }: { expansion: RefObject<Group | null>; middle: RefObject<Group | null> }) {
  return <group><Block at={[0, -.45, 0]} size={[5.6, .32, 3.9]} color="#426755"/>
    {[-1.8, -.6, .6, 1.8].map(x => <Block key={x} at={[x, -.24, 0]} size={[.15, .08, 2.9]} color="#d1b475"/>)}
    <group ref={middle}><Block at={[0, .05, 0]} size={[5.3, .22, 3.6]} color="#afbf97"/>{[-1.7, 0, 1.7].map(x => <Block key={x} at={[x, .23, 0]} size={[1.05, .13, 1.8]} color="#496d68"/>)}</group>
    <group ref={expansion}><Block at={[0, .47, 0]} size={[5, .22, 3.3]} color="#e4ddbf"/><Station at={[-1.4, .6, 0]}/><Station at={[1.4, .6, 0]}/><Block at={[0, 1.4, -.35]} size={[.95, 1.6, 1.2]} color="#d4bd87"/><Block at={[0, 2.24, -.35]} size={[1.06, .1, 1.3]} color="#3c5e4d"/></group>
  </group>;
}
function Objects({ kind, control, onReady, onLost }: Pick<Props, 'kind' | 'control' | 'onReady' | 'onLost'>) {
  const rig = useRef<Group>(null), expansion = useRef<Group>(null), middle = useRef<Group>(null), lid = useRef<Group>(null);
  const value = useRef(control.current.expanded ? 1 : 0);
  const { camera, gl, size } = useThree();
  const callbacks = useRef({ onReady, onLost }); callbacks.current = { onReady, onLost };
  useEffect(() => { const view = kind === 'learning' ? [6.7, 4.8] : kind === 'implementation' ? [8.5, 7.5] : kind === 'support' ? [7.3, 6] : [9.5, 6.7]; camera.zoom = Math.min(size.width / view[0], size.height / view[1]); camera.lookAt(0, .7, 0); camera.updateProjectionMatrix(); }, [camera, size, kind]);
  useEffect(() => {
    callbacks.current.onReady();
    const canvas = gl.domElement;
    let dragging = false, previousX = 0;
    const down = (e: PointerEvent) => { if (e.button !== 0) return; dragging = true; previousX = e.clientX; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!dragging) return; control.current.rotation += (e.clientX - previousX) * .009; previousX = e.clientX; };
    const up = () => { dragging = false; };
    const lost = (e: Event) => { e.preventDefault(); callbacks.current.onLost(); };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('lostpointercapture', up); canvas.addEventListener('webglcontextlost', lost);
    return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('lostpointercapture', up); canvas.removeEventListener('webglcontextlost', lost); };
  }, [gl, control]);
  useFrame((_, delta) => {
    const d = delta;
    value.current = MathUtils.damp(value.current, control.current.expanded ? 1 : 0, 5, d);
    const t = value.current;
    if (rig.current) { rig.current.rotation.y = MathUtils.damp(rig.current.rotation.y, -.22 + control.current.rotation + control.current.scroll * .18, 6, d); gl.domElement.dataset.rotation = rig.current.rotation.y.toFixed(3); }
    gl.domElement.dataset.expansion = t.toFixed(3);
    if (lid.current) lid.current.rotation.x = kind === 'learning' ? 1.3 - t * 1.5 : -.2;
    if (expansion.current) {
      if (kind === 'network' || kind === 'ecosystem') expansion.current.scale.setScalar(.01 + t * .99);
      else if (kind === 'implementation') expansion.current.position.y = t * 1.6;
      else if (kind === 'support') { expansion.current.position.x = t * .65; expansion.current.rotation.y = -.15 * t; }
      else { expansion.current.position.x = t * .7; expansion.current.position.y = t * .45; }
    }
    if (middle.current) middle.current.position.y = kind === 'implementation' ? t * .8 : t * .25;
  });
  const network = kind === 'network' || kind === 'ecosystem';
  return <><group ref={rig} rotation={[0, -.22, 0]}>
    {network ? <Network expansion={expansion}/> : kind === 'support' ? <Support expansion={expansion}/> : kind === 'implementation' ? <Layers expansion={expansion} middle={middle}/> : <group position={[-.65, -.4, 0]}>
      <group scale={.9}><Laptop lid={lid}/></group>
      {kind !== 'learning' && <group ref={expansion}>{kind === 'administration' ? <><DataPanel at={[2.6, 1.1, .25]}/><DataPanel at={[-2.7, 1.4, -.45]}/></> : <><group position={[2.6, 1.2, .3]} rotation={[0, -.18, 0]} scale={.85}><Tablet/></group><group position={[-2.65, .75, .8]} rotation={[0, .15, 0]}><Tablet phone/></group></>}</group>}
    </group>}
  </group><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.94, 0]} receiveShadow><planeGeometry args={[20, 20]}/><shadowMaterial opacity={.12}/></mesh></>;
}
export default function MediaScene(props: Props) {
  return <Canvas orthographic camera={{ position: [0, 5, 11], zoom: 40, near: .1, far: 70 }} frameloop={props.active ? 'always' : 'never'} dpr={window.innerWidth < 768 ? 1 : 1.25} shadows gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
    <ambientLight intensity={1.6}/><hemisphereLight args={['#fff8e5', '#83916b', 1.4]}/><directionalLight position={[-4, 8, 6]} intensity={2.7} castShadow shadow-mapSize={[512, 512]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.04}/>
    <Objects {...props}/>
  </Canvas>;
}
