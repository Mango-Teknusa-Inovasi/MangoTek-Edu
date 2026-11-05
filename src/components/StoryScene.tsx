import { useEffect, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import SchoolDiorama from './SchoolDiorama';
import { Laptop, Tablet } from './DeviceModels';
import type { RenderQuality, StoryInteraction } from './story-types';

const settle = (current: number, target: number, delta: number) => { const next = MathUtils.damp(current, target, 7, Math.min(delta, .05)); return Math.abs(next - target) < .0005 ? target : next; };
const phase = (p: number, start: number, end: number) => MathUtils.smoothstep(p, start, end);
interface SceneProps { progress: RefObject<number>; interaction: RefObject<StoryInteraction>; quality: RenderQuality; visible: boolean; onReady: () => void; onLost: () => void }
function Scene({ progress, interaction, quality }: Pick<SceneProps, 'progress' | 'interaction' | 'quality'>) {
  const school = useRef<Group>(null); const orbit = useRef<Group>(null);
  const laptop = useRef<Group>(null); const lid = useRef<Group>(null); const tablet = useRef<Group>(null); const phone = useRef<Group>(null);
  const { camera, size, gl } = useThree();
  useEffect(() => { camera.zoom = Math.min(size.width / 12.3, size.height / 10.2); camera.lookAt(0, 1.2, 0); camera.updateProjectionMatrix(); }, [camera, size]);
  useEffect(() => {
    const canvas = gl.domElement;
    let previousX = 0, previousY = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || progress.current >= .2) return;
      interaction.current.dragging = true; previousX = e.clientX; previousY = e.clientY; canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (progress.current >= .2) return;
      const state = interaction.current;
      if (state.dragging) { state.yaw += (e.clientX - previousX) * .009; state.tilt = MathUtils.clamp(state.tilt + (e.clientY - previousY) * .002, -.12, .16); previousX = e.clientX; previousY = e.clientY; }
      else { const rect = canvas.getBoundingClientRect(); state.pointer = ((e.clientX - rect.left) / rect.width - .5) * .09; }
    };
    const up = () => { interaction.current.dragging = false; };
    const leave = () => { interaction.current.pointer = 0; };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('lostpointercapture', up); canvas.addEventListener('pointerleave', leave);
    return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('lostpointercapture', up); canvas.removeEventListener('pointerleave', leave); };
  }, [gl, interaction, progress, quality]);
  useFrame((_, delta) => {
    const p = progress.current; const retreat = phase(p, .2, .42); const enter = phase(p, .36, .58); const spread = phase(p, .65, .84); const finish = phase(p, .85, 1);
    if (!school.current || !orbit.current || !laptop.current || !lid.current || !tablet.current || !phone.current) return;
    school.current.scale.setScalar(1 - retreat * .56);
    school.current.position.set(0, -.3 + retreat * .8, -retreat * 4.1);
    // The outer rig owns the story; the inner rig owns user rotation.
    orbit.current.rotation.y = settle(orbit.current.rotation.y, -.48 + (interaction.current.yaw + interaction.current.pointer) * (1 - phase(p, .2, .36)), delta);
    orbit.current.rotation.x = settle(orbit.current.rotation.x, interaction.current.tilt * (1 - retreat), delta);
    gl.domElement.dataset.yaw = orbit.current.rotation.y.toFixed(3);
    gl.domElement.dataset.tilt = orbit.current.rotation.x.toFixed(3);
    laptop.current.visible = p > .34;
    laptop.current.position.set(.2 + spread * .5, -5.5 + enter * 5.1, 1 + enter * .4);
    laptop.current.rotation.set(-.09, -.42 + enter * .6 - spread * .1, -.02);
    laptop.current.scale.setScalar(.95 - spread * .09);
    lid.current.rotation.x = Math.PI / 2 - phase(p, .4, .65) * 1.73;
    tablet.current.visible = p > .64; phone.current.visible = p > .64;
    tablet.current.position.set(-6 + spread * 3, .6, 1.8); tablet.current.rotation.set(-.18, .18 + (1 - spread) * .5, -.08 + finish * .03);
    phone.current.position.set(6 - spread * 2.6, -.1, 2.8); phone.current.rotation.set(-.18, -.2, .08 - finish * .04);
  });
  return <>
    <group ref={school}><group ref={orbit} rotation={[0, -.48, 0]}><SchoolDiorama interaction={interaction} quality={quality}/></group></group>
    <group ref={laptop} visible={false}><Laptop lid={lid}/></group>
    <group ref={tablet} visible={false}><Tablet/></group><group ref={phone} visible={false}><Tablet phone/></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.55, 0]} receiveShadow><planeGeometry args={[30, 30]}/><shadowMaterial opacity={.16}/></mesh>
  </>;
}
function Lifecycle({ onReady, onLost }: Pick<SceneProps, 'onReady' | 'onLost'>) {
  const { gl } = useThree();
  const callbacks = useRef({ onReady, onLost }); callbacks.current = { onReady, onLost };
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); callbacks.current.onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    callbacks.current.onReady();
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl]);
  return null;
}
export default function StoryScene(props: SceneProps) {
  return <Canvas orthographic camera={{ position: [0, 6.5, 13], zoom: 50, near: .1, far: 100 }} dpr={props.quality === 'mobile' ? 1 : 1.5} shadows frameloop={props.visible ? 'always' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
    <ambientLight intensity={1.4}/><hemisphereLight args={['#fff5dc', '#667a5a', 1.5]}/><directionalLight position={[-4, 9, 6]} intensity={3} castShadow shadow-mapSize={props.quality === 'mobile' ? [512, 512] : [1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={.05}/><directionalLight position={[5, 4, -6]} intensity={2} color="#d9eed6"/>
    <Scene {...props}/><Lifecycle onReady={props.onReady} onLost={props.onLost}/>
  </Canvas>;
}
