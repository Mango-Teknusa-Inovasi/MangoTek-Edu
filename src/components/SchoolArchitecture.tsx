import { Ball, Block } from './ScenePrimitives';

function WindowPane({ x, y, width = .6 }: { x: number; y: number; width?: number }) {
  return <group position={[x, y, .012]}>
    <Block at={[0, 0, 0]} size={[width + .08, .72, .055]} color="#d6d8c8"/>
    <Block at={[0, .01, .032]} size={[width, .61, .025]} color="#365f5d" metal/>
    <Block at={[0, .01, .05]} size={[.025, .62, .018]} color="#dbe3d5"/>
    <Block at={[-width * .22, .17, .048]} size={[width * .28, .025, .012]} color="#88b3ad"/>
  </group>;
}

function Wing({ x }: { x: number }) {
  const width = 2.05, depth = 2.2;
  return <group position={[x, 0, -1.4]}>
    <Block at={[0, 1.3, 0]} size={[width, 2.6, depth]} color="#f1e9d6"/>
    <Block at={[0, .14, 0]} size={[width + .06, .28, depth + .06]} color="#cbbb9a"/>
    <Block at={[0, 1.32, 0]} size={[width + .06, .09, depth + .06]} color="#c8b68e"/>
    <Block at={[0, 2.64, 0]} size={[width + .18, .14, depth + .18]} color="#476252"/>
    <Block at={[0, 2.74, 0]} size={[width - .14, .07, depth - .12]} color="#d5d7bf"/>
    {/* Each facade owns its windows in local coordinates, with a margin at both corners. */}
    {[0, Math.PI].map(angle => <group key={angle} rotation={[0, angle, 0]}><group position={[0, 0, depth / 2]}>{[.84, 2].flatMap(y => [-.48, .48].map(wx => <WindowPane key={`${y}-${wx}`} x={wx} y={y}/>))}</group></group>)}
    <group rotation={[0, x < 0 ? -Math.PI / 2 : Math.PI / 2, 0]}><group position={[0, 0, width / 2]}>{[.84, 2].flatMap(y => [-.5, .5].map(wx => <WindowPane key={`${y}-${wx}`} x={wx} y={y}/>))}</group></group>
    {[-.48, .48].map(px => <group key={px} position={[px, 2.88, -.12]} rotation={[.12, 0, 0]}><Block at={[0, 0, 0]} size={[.8, .055, 1.5]} color="#315b6c" metal/>{[-.45, 0, .45].map(z => <Block key={z} at={[0, .032, z]} size={[.75, .012, .014]} color="#8db1b7"/>)}</group>)}
  </group>;
}
export default function SchoolArchitecture() {
  return <group>
    <Wing x={-1.98}/><Wing x={1.98}/>
    <group position={[0, 0, -1.25]}>
      <Block at={[0, 2.25, 0]} size={[1.85, 4.5, 2.55]} color="#e4d4ad"/>
      <Block at={[0, .17, 0]} size={[1.97, .34, 2.67]} color="#b9aa89"/>
      <Block at={[0, 4.5, 0]} size={[2.04, .18, 2.74]} color="#355548"/>
      <Block at={[0, 4.67, 0]} size={[1.8, .16, 2.5]} color="#c1caad"/>
      <Block at={[0, 4.81, 0]} size={[1.35, .12, 1.95]} color="#e2ddc4"/>
      {[-.83, .83].map(x => <Block key={x} at={[x, 2.2, 1.292]} size={[.1, 4.15, .075]} color="#c2b086"/>)}
      {[0, Math.PI / 2, -Math.PI / 2, Math.PI].map(angle => <group key={angle} rotation={[0, angle, 0]}><group position={[0, 0, Math.abs(angle) === Math.PI / 2 ? .925 : 1.275]}>{[2, 3.15].flatMap(y => [-.38, .38].map(x => <WindowPane key={`${y}-${x}`} x={x} y={y} width={.46}/>))}</group></group>)}
      <Block at={[0, .68, 1.29]} size={[1.05, 1.3, .07]} color="#264d43"/>
      <Block at={[0, .68, 1.335]} size={[.035, 1.3, .025]} color="#d3c9aa"/>
      <Block at={[0, 1.45, 1.53]} size={[1.5, .1, .82]} color="#3d5d4e"/>
      <Ball at={[0, 4, 1.295]} size={[.3, .3, .035]} color="#edc575"/>
      <Block at={[0, 4.07, 1.34]} size={[.025, .17, .018]} color="#355440"/>
      <Block at={[.07, 3.99, 1.34]} size={[.16, .025, .018]} color="#355440"/>
    </group>
    <Block at={[0, .13, .35]} size={[1.5, .24, .6]} color="#ccc5af"/>
    <Block at={[0, .06, .72]} size={[1.75, .1, .25]} color="#ded8c2"/>
    <Block at={[-2.85, .64, .95]} size={[1.1, 1.28, 1.7]} color="#eadcc1"/>
    <Block at={[-2.85, 1.33, .95]} size={[1.24, .12, 1.84]} color="#b0825c"/>
    <Block at={[-2.85, .75, 1.81]} size={[.8, .66, .045]} color="#355c55"/>
    <Block at={[-2.85, .75, 1.84]} size={[.54, .36, .018]} color="#9abcb4"/>
    <Block at={[-2.92, .8, 1.855]} size={[.22, .05, .008]} color="#f3cb76"/>
    <Block at={[2.55, 2.97, -.6]} size={[.18, .32, .18]} color="#f6f1de"/>
    <Block at={[2.55, 3.25, -.6]} size={[.025, .4, .025]} color="#566d62"/>
  </group>;
}
