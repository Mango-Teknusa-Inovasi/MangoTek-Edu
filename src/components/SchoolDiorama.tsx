import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import SchoolArchitecture from './SchoolArchitecture';
import WalkingStudent from './WalkingStudent';
import { Ball, Block, type Vec3 } from './ScenePrimitives';
import type { StoryInteraction, RenderQuality } from './story-types';

function Tree({ at, scale = 1, detail }: { at: Vec3; scale?: number; detail: boolean }) {
  return <group position={at} scale={scale}><Block at={[0, .7, 0]} size={[.15, 1.4, .15]} color="#887151"/><Block at={[.18, 1.05, 0]} size={[.09, .65, .09]} color="#887151" rotation={[0, 0, -.65]}/><Ball at={[0, 1.65, 0]} size={[.65, .67, .58]} color="#537747"/><Ball at={[-.38, 1.32, .1]} size={[.48, .48, .48]} color="#6e914d"/><Ball at={[.34, 1.48, .12]} size={[.48, .52, .48]} color="#789b53"/>{detail && <><Ball at={[.35, 1.36, .53]} size={[.07, .1, .07]} color="#f3b13e"/><Ball at={[-.2, 1.64, .52]} size={[.07, .1, .07]} color="#f3b13e"/></>}</group>;
}
export default function SchoolDiorama({ interaction, quality }: { interaction: React.RefObject<StoryInteraction>; quality: RenderQuality }) {
  const foliage = useRef<Group>(null);
  const flag = useRef<Group>(null);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (interaction.current.paused) return;
    time.current += Math.min(delta, .05);
    if (foliage.current) foliage.current.rotation.z = Math.sin(time.current * .7) * .004;
    if (flag.current) flag.current.rotation.y = Math.sin(time.current * 1.5) * .1;
  });
  const detail = quality === 'desktop';
  return <group>
    <Block at={[0, -.23, 0]} size={[8.6, .35, 6.8]} color="#c9c3a6"/>
    <Block at={[0, -.04, 0]} size={[8.5, .09, 6.7]} color="#9caf7b"/>
    <Block at={[0, .02, .3]} size={[6.9, .05, 4.8]} color="#e4ddca"/>
    <Block at={[0, .045, 2.65]} size={[8.3, .035, .5]} color="#eee8d8"/>
    <SchoolArchitecture/>
    <Block at={[1.9, .065, 1.2]} size={[2.45, .035, 1.9]} color="#b87756"/>
    {[-.87, .87].map(z => <Block key={z} at={[1.9, .09, 1.2 + z]} size={[2.28, .015, .025]} color="#f1ddbc"/>)}
    {[.79, 1.9, 3.01].map(x => <Block key={x} at={[x, .09, 1.2]} size={[.025, .015, 1.74]} color="#f1ddbc"/>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.9, .1, 1.2]}><ringGeometry args={[.3, .325, 32]}/><meshStandardMaterial color="#f1ddbc"/></mesh>
    <Block at={[3.12, .5, 1.2]} size={[.04, 1, .04]} color="#e9e6cf"/><Block at={[3.12, 1.04, 1.2]} size={[.05, .32, .45]} color="#f5f0dd"/>
    <Block at={[-1.3, .3, 1.3]} size={[.85, .12, .33]} color="#a77b53"/><Block at={[-1.3, .47, 1.16]} size={[.85, .28, .06]} color="#a77b53"/>
    {[-1.6, -1].map(x => <Block key={x} at={[x, .16, 1.3]} size={[.06, .3, .26]} color="#425e4a"/>)}
    <Block at={[-.45, .9, 1.5]} size={[.035, 1.8, .035]} color="#f2eedc"/>
    <group ref={flag} position={[-.45, 1.65, 1.5]}><Block at={[.23, .07, 0]} size={[.46, .15, .02]} color="#c95042"/><Block at={[.23, -.08, 0]} size={[.46, .15, .02]} color="#fff9ec"/></group>
    <group ref={foliage}><Tree at={[-3.65, 0, -2.3]} scale={.9} detail={detail}/><Tree at={[3.6, 0, -2.35]} scale={.95} detail={detail}/><Tree at={[-3.3, 0, 2.25]} scale={.95} detail={detail}/><Tree at={[3.65, 0, 2.4]} scale={.75} detail={detail}/>{detail && <Tree at={[-1.95, 0, 2.8]} scale={.6} detail/>}</group>
    <WalkingStudent interaction={interaction} offset={.05} shirt="#e5b95d"/>
    <WalkingStudent interaction={interaction} route={1} offset={.18}/>
    {detail && <><WalkingStudent interaction={interaction} offset={.55} shirt="#7ca1a0" speed={.33}/><WalkingStudent interaction={interaction} route={1} offset={.68} shirt="#f3e4bc" speed={.33}/></>}
    {[-2.5, -1.6, .9, 1.8, 2.7].map(x => <Ball key={x} at={[x, .15, -3]} size={[.35, .23, .22]} color="#6b8653"/>)}
  </group>;
}
