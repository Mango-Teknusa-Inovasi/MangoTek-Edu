import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitText from './react-bits/SplitText';
import { chapters as chapterDefaults, type StoryMode, type StoryInteraction } from './story-types';
import type { ServiceId } from '../data/content';

import { usePortal, useServiceHref } from '../cms/PortalContext';
gsap.registerPlugin(ScrollTrigger);
const StoryScene = lazy(() => import('./StoryScene'));
class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function DigitalStory({ onSelect }: { onSelect: (id: ServiceId) => void }) {
  const {hero,identity,theme}=usePortal();
  const serviceHref=useServiceHref();
  const chapters=chapterDefaults.map((c,i)=>({...c,...hero.chapters[i]}));
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const interaction = useRef<StoryInteraction>({ yaw: 0, tilt: 0, pointer: 0, dragging: false, paused: false });
  const [mode, setMode] = useState<StoryMode>('loading');
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [mobile, setMobile] = useState(false);
  const fail = () => { setMode('static'); setReady(false); };

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const small = matchMedia('(max-width: 767px)');
    const configure = () => {
      setMobile(small.matches);
      if (motion.matches || !hero.motion || hero.preset === 'static') { setMode('static'); return; }
      const canvas = document.createElement('canvas');
      try {
        const gl = canvas.getContext('webgl2');
        setMode(gl ? 'interactive' : 'static');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch { setMode('static'); }
    };
    configure();
    const resize = () => setMobile(small.matches);
    const visibility = () => setActiveTab(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', configure); small.addEventListener('change', resize);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', configure); small.removeEventListener('change', resize); };
  }, [hero.motion,hero.preset]);

  useEffect(() => {
    if (mode !== 'interactive' || !root.current || !stage.current) return;
    const element = stage.current;
    const background = gsap.utils.interpolate(theme.background, '#122e27');
    const ink = gsap.utils.interpolate(theme.ink, '#000000');
    const timeline = { value: 0 };
    let lastChapter = -1;
    const animation = gsap.to(timeline, { value: 1, ease: 'none',
      scrollTrigger: { trigger: root.current, start: mobile ? 'top 72px' : 'top 80px', end: 'bottom bottom', scrub: .45, invalidateOnRefresh: true },
      onUpdate: () => {
        const p = timeline.value; progress.current = p;
        const index = chapters.reduce((found, item, i) => p >= item.start - .00001 ? i : found, 0);
        if (index !== lastChapter) { setChapter(index); lastChapter = index; }
        const raw = gsap.utils.clamp(0, 1, (p - .2) / .24);
        const blend = raw * raw * (3 - 2 * raw);
        element.style.backgroundColor = background(blend);
        element.style.color = blend < .64 ? ink(Math.min(1, blend / .5)) : '#fffefa';
        element.style.setProperty('--story-progress', String(p));
        element.dataset.progress = p.toFixed(3);
      },
    });
    let alive = true;
    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    return () => { alive = false; animation.scrollTrigger?.kill(); animation.kill(); element.style.removeProperty('background-color'); element.style.removeProperty('color'); progress.current = 0; };
  }, [mode, mobile,theme.background,theme.ink]);

  const rotate = (amount: number) => { interaction.current.yaw += amount; };
  const reset = () => { interaction.current.yaw = 0; interaction.current.tilt = 0; interaction.current.pointer = 0; };
  const isStatic = mode === 'static';
  const active = isStatic ? 0 : chapter;
  return <section id="beranda" ref={root} className={`digital-story ${isStatic ? 'story-static' : ''}`} aria-label="Perjalanan digital sekolah">
    <div ref={stage} className="story-stage" data-chapter={chapters[active].id} data-progress="0">
      <div className="story-topline"><span>{identity.name} · K–12</span><a href={serviceHref}>Lewati ke layanan <span aria-hidden="true">↗</span></a></div>
      <div className="story-copy">
        <div hidden={active !== 0}><p className="story-eyebrow">{hero.eyebrow}</p><h1><SplitText text={hero.title} tag="span" splitType="words" duration={.65} delay={60} textAlign="left"/><SplitText text={hero.subtitle} className="hero-second" tag="span" splitType="words" duration={.65} delay={60} textAlign="left"/></h1><p className="story-description">{chapters[0].text}</p><a className="button button-mango" href={serviceHref}>Jelajahi Layanan <span aria-hidden="true">↗</span></a></div>
        {chapters.slice(1).map((item, index) => <div key={item.id} hidden={active !== index + 1}><p className="story-eyebrow">0{index + 2} / {item.label}</p><h2>{item.title}</h2><p className="story-description">{item.text}</p>{index === 3 && <a className="button button-mango" href={serviceHref}>Temukan kebutuhan sekolah ↗</a>}</div>)}
      </div>
      <div className="story-visual campus-stage" tabIndex={isStatic ? undefined : 0} role="group" aria-label="Miniatur sekolah interaktif" aria-description="Seret untuk memutar. Tombol panah untuk rotasi, Home untuk reset, dan spasi untuk menjeda gerakan." onKeyDown={event => {
        if (isStatic || active !== 0) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -Math.PI / 4 : Math.PI / 4); }
        if (event.key === 'Home') { event.preventDefault(); reset(); }
        if (event.key === ' ') { event.preventDefault(); interaction.current.paused = !interaction.current.paused; }
      }} onDoubleClick={reset} data-scene={mode === 'interactive' && ready ? '3d' : 'static'}>
        {(!ready || isStatic) && <img className="story-poster campus-fallback" src="/school-poster.png" alt="Diorama sekolah dengan ruang kelas, halaman, dan pohon mangga"/>}
        {mode === 'interactive' && <SceneBoundary onFail={fail}><Suspense fallback={null}><StoryScene progress={progress} interaction={interaction} quality={mobile ? 'mobile' : 'desktop'} visible={visible && activeTab} onReady={() => setReady(true)} onLost={fail}/></Suspense></SceneBoundary>}
      </div>

      <div className="story-bottom"><span className="story-count">0{active + 1}<span> / 05</span></span><span>{chapters[active].label}</span><span className="story-scroll-hint">{isStatic ? 'Teknologi untuk pendidikan' : 'Gulir untuk menjelajahi ↓'}</span></div>
    </div>
    {isStatic && <div className="static-journey">{chapters.slice(1).map((item, index) => <article key={item.id}><div><p className="story-eyebrow">0{index + 2} / {item.label}</p><h2>{item.title}</h2><p>{item.text}</p></div><img src={index === 0 ? '/school-poster.png' : '/ecosystem-poster.png'} alt={index === 0 ? 'Sekolah terhubung' : 'Laptop, tablet, dan ponsel untuk pembelajaran digital'} loading="lazy"/></article>)}</div>}
    <div className="story-shortcuts"><span>Mulai dari kebutuhan sekolah Anda</span><button onClick={() => onSelect('learning')}>Ruang untuk tumbuh Pembelajaran digital <span aria-hidden="true">↗</span></button><button onClick={() => onSelect('network')}>Sekolah terkoneksi <span aria-hidden="true">↗</span></button></div>
  </section>;
}
