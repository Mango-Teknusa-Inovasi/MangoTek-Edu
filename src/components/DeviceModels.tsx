import { useEffect, useMemo, type RefObject } from 'react';
import { CanvasTexture, SRGBColorSpace, type Group } from 'three';
import { Block } from './ScenePrimitives';

function Screen({ width, height, phone = false }: { width: number; height: number; phone?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = phone ? 384 : 1024; canvas.height = phone ? 720 : 640;
    const c = canvas.getContext('2d')!; const w = canvas.width;
    c.fillStyle = '#f7f5e9'; c.fillRect(0, 0, w, canvas.height);
    c.fillStyle = '#244b3a'; c.fillRect(0, 0, w, 75);
    c.fillStyle = '#fffefa'; c.font = 'bold 26px sans-serif'; c.fillText('MangoTek Edu', 30, 48);
    c.fillStyle = '#244b3a'; c.font = 'bold 34px sans-serif'; c.fillText(phone ? 'Halo, Nara.' : 'Hari ini, kita belajar.', 32, 138);
    c.fillStyle = '#68776a'; c.font = '20px sans-serif'; c.fillText('Ruang belajar · Kelas 7', 32, 176);
    c.fillStyle = '#dfe8d1'; c.beginPath(); c.roundRect(30, 212, w - 60, phone ? 220 : 250, 18); c.fill();
    const cx = phone ? 200 : 735;
    c.strokeStyle = '#567741'; c.lineWidth = 8; c.beginPath(); c.moveTo(cx, 410); c.lineTo(cx, 265); c.stroke();
    c.fillStyle = '#62864a'; c.beginPath(); c.ellipse(cx - 30, 335, 42, 20, .65, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8da85c'; c.beginPath(); c.ellipse(cx + 30, 285, 44, 23, -.65, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e2a63d'; c.beginPath(); c.arc(cx + 40, 350, 18, 0, Math.PI * 2); c.fill();
    if (!phone) { c.fillStyle = '#244b3a'; c.font = 'bold 36px sans-serif'; c.fillText('Mengenal', 64, 290); c.fillText('dunia tumbuhan', 64, 340); c.font = '20px sans-serif'; c.fillText('Amati. Pelajari. Tumbuhkan.', 64, 394); }
    c.fillStyle = '#244b3a'; c.font = 'bold 23px sans-serif'; c.fillText('Kegiatan kelas', 32, phone ? 480 : 510);
    c.fillStyle = '#e8c378'; c.beginPath(); c.roundRect(32, phone ? 506 : 535, phone ? w - 64 : 420, 58, 10); c.fill();
    c.fillStyle = '#244b3a'; c.font = '20px sans-serif'; c.fillText('Jurnal pengamatan', 52, phone ? 542 : 571);
    if (phone) { c.fillStyle = '#e1e6d8'; c.fillRect(32, 600, w - 64, 5); c.fillRect(32, 623, w - 100, 5); }
    const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; return t;
  }, [phone]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh><planeGeometry args={[width, height]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
export function Laptop({ lid }: { lid: RefObject<Group | null> }) {
  return <group>
    <Block at={[0, 0, 0]} size={[4.7, .13, 2.7]} color="#bec8bb" metal/>
    <Block at={[0, .075, -.3]} size={[4.15, .025, 1.25]} color="#293f39"/>
    {Array.from({ length: 5 }, (_, row) => <group key={row}>{Array.from({ length: 13 }, (_, col) => <Block key={col} at={[-1.87 + col * .31, .096, -.82 + row * .25]} size={[.25, .02, .17]} color="#65736b"/>)}</group>)}
    <Block at={[0, .076, .78]} size={[1.5, .018, .65]} color="#9eafa4" metal/>
    <group position={[0, .08, -1.23]} ref={lid}><Block at={[0, 1.45, 0]} size={[4.7, 2.9, .13]} color="#b5c1b4" metal/><Block at={[0, 1.45, .073]} size={[4.48, 2.7, .035]} color="#172d27"/><group position={[0, 1.46, .1]}><Screen width={4.27} height={2.48}/></group><Block at={[0, 2.78, .1]} size={[.055, .035, .015]} color="#50695a"/></group>
  </group>;
}
export function Tablet({ phone = false }: { phone?: boolean }) {
  const width = phone ? 1.12 : 2.45; const height = phone ? 2.22 : 3.35;
  return <group><Block at={[0, 0, 0]} size={[width, height, .14]} color={phone ? '#d8b270' : '#b4c0b2'} metal/><Block at={[0, 0, .078]} size={[width - .09, height - .1, .025]} color="#152c25"/><group position={[0, -.025, .097]}><Screen width={width - .19} height={height - .28} phone/></group><Block at={[0, height / 2 - .09, .1]} size={[phone ? .26 : .06, .04, .02]} color="#172d27"/></group>;
}
