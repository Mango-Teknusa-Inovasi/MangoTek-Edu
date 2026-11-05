import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Group, Vector3 } from 'three';
import { Ball, Block, type Vec3 } from './ScenePrimitives';
import type { StoryInteraction } from './story-types';

export const courtyardRoutes: Vec3[][] = [
  [[.05, .06, 2.6], [.31, .06, 2.3], [.3, .06, 1.13], [.08, .06, .98], [-.13, .06, 1.2], [-.15, .06, 2.3]],
  [[-1.25, .06, 2.65], [-.6, .06, 2.52], [2.6, .06, 2.52], [2.85, .06, 2.72], [2.4, .06, 2.87], [-.8, .06, 2.87]],
];
export default function WalkingStudent({ interaction, route = 0, offset = 0, shirt = '#f4eddb', speed = .33 }: { interaction: RefObject<StoryInteraction>; route?: number; offset?: number; shirt?: string; speed?: number }) {
  const root = useRef<Group>(null), body = useRef<Group>(null);
  const legs = useRef<(Group | null)[]>([]), arms = useRef<(Group | null)[]>([]), knees = useRef<(Group | null)[]>([]);
  const curve = useMemo(() => new CatmullRomCurve3(courtyardRoutes[route].map(p => new Vector3(...p)), true, 'catmullrom', .25), [route]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const distance = useRef(offset * length);
  const position = useMemo(() => new Vector3(), []), tangent = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    if (!root.current || !body.current) return;
    if (!interaction.current.paused) distance.current += speed * Math.min(delta, .05);
    const t = (distance.current % length) / length;
    curve.getPointAt(t, position); curve.getTangentAt(t, tangent);
    root.current.position.copy(position);
    root.current.rotation.y = Math.atan2(tangent.x, tangent.z);
    const gait = distance.current / .43 * Math.PI * 2;
    body.current.position.y = Math.abs(Math.sin(gait)) * .012;
    for (let i = 0; i < 2; i++) {
      const swing = Math.sin(gait + i * Math.PI);
      if (legs.current[i]) legs.current[i]!.rotation.x = swing * .42;
      if (arms.current[i]) arms.current[i]!.rotation.x = -swing * .3;
      if (knees.current[i]) knees.current[i]!.rotation.x = Math.max(0, -swing) * .36;
    }
  });
  return <group ref={root} name="walking-student"><group ref={body}>
    <Ball at={[0, .59, 0]} size={[.085, .105, .085]} color="#bd8a68"/>
    <Ball at={[0, .64, -.018]} size={[.09, .067, .083]} color="#3b352c"/>
    <Block at={[0, .4, 0]} size={[.18, .22, .12]} color={shirt}/>
    <Block at={[0, .4, -.08]} size={[.14, .17, .07]} color="#c39255"/>
    {[-1, 1].map((side, i) => <group key={side}>
      <group ref={el => { arms.current[i] = el; }} position={[side * .12, .47, 0]}><Block at={[0, -.055, 0]} size={[.055, .12, .065]} color={shirt}/><Block at={[0, -.15, .01]} size={[.045, .09, .045]} color="#bd8a68"/></group>
      <group ref={el => { legs.current[i] = el; }} position={[side * .05, .29, 0]}><Block at={[0, -.065, 0]} size={[.065, .14, .075]} color="#34594f"/><group ref={el => { knees.current[i] = el; }} position={[0, -.13, 0]}><Block at={[0, -.065, 0]} size={[.055, .13, .065]} color="#34594f"/><Block at={[0, -.13, .025]} size={[.07, .045, .115]} color="#383e32"/></group></group>
    </group>)}
  </group></group>;
}
