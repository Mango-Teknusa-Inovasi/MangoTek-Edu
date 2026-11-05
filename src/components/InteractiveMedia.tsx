import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { mediaContent, type MediaKind } from './media-types';
import { usePortal } from '../cms/PortalContext';
const MediaScene = lazy(() => import('./MediaScene'));
class Boundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function InteractiveMedia({ kind, compact = false, dark = false }: { kind: MediaKind; compact?: boolean; dark?: boolean }) {
  const {hero}=usePortal();
  const root = useRef<HTMLElement>(null);
  const control = useRef({ rotation: 0, expanded: kind === 'learning', scroll: 0 });
  const [visible, setVisible] = useState(false), [enabled, setEnabled] = useState(false), [ready, setReady] = useState(false), [expanded, setExpanded] = useState(kind === 'learning');
  const [tabActive, setTabActive] = useState(true);
  const content = mediaContent[kind];
  const pointerStart = useRef({ x: 0, y: 0 });
  const toggle = () => { control.current.expanded = !control.current.expanded; setExpanded(control.current.expanded); };
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const configure = () => setEnabled(!motion.matches && hero.motion && hero.preset!=='static');
    configure(); motion.addEventListener('change', configure);
    const observer = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); if (!entry.isIntersecting) setReady(false); }, { threshold: .02 });
    if (root.current) observer.observe(root.current);
    const update = () => { if (root.current) { const rect = root.current.getBoundingClientRect(); control.current.scroll = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight)); } };
    const visibility = () => setTabActive(!document.hidden);
    window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); document.addEventListener('visibilitychange', visibility); update();
    return () => { observer.disconnect(); motion.removeEventListener('change', configure); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); document.removeEventListener('visibilitychange', visibility); };
  }, [hero.motion,hero.preset]);
  const fail = () => { setEnabled(false); setReady(false); };
  return <figure ref={root} className={`interactive-media ${compact ? 'media-compact' : ''} ${dark ? 'media-dark' : ''}`} aria-label={content.title} data-media={kind} data-rendering={visible && enabled && tabActive ? 'active' : 'static'}>
    <div className="media-viewport" data-ready={ready} tabIndex={enabled ? 0 : undefined} role={enabled ? 'button' : undefined} aria-label={content.title} aria-pressed={enabled ? expanded : undefined} aria-description="Klik atau tekan Enter untuk menjelajahi. Tombol panah untuk rotasi dan Home untuk reset." onPointerDown={event => { pointerStart.current = { x: event.clientX, y: event.clientY }; }} onClick={event => { if (enabled && Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y) < 8) toggle(); }} onKeyDown={event => {
      if (!enabled) return;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); control.current.rotation += event.key === 'ArrowLeft' ? -Math.PI / 4 : Math.PI / 4; }
      if (event.key === 'Home') { event.preventDefault(); control.current.rotation = 0; control.current.expanded = kind === 'learning'; setExpanded(kind === 'learning'); }
    }}>
      {(!ready || !visible || !enabled) && <img src={`/media/${kind}.png`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/ecosystem-poster.png'; }} alt={content.title} loading="lazy"/>}
      {visible && enabled && <Boundary onFail={fail}><Suspense fallback={null}><MediaScene kind={kind} control={control} active={tabActive} onReady={() => setReady(true)} onLost={fail}/></Suspense></Boundary>}
    </div>
    <figcaption className="sr-only">{content.title}. Ilustrasi konsep. {content.detail}</figcaption>
  </figure>;
}
