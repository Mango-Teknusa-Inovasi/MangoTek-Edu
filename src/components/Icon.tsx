import type { CSSProperties } from 'react';

export type IconName = 'arrow' | 'diagonal' | 'book' | 'network' | 'device' | 'support' | 'administration' | 'check' | 'plus' | 'close' | 'menu' | 'leaf';
const paths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  diagonal: <><path d="M6 18 18 6M6 6h12v12" /></>,
  book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1ZM12 6v14" /><path d="m6 9 3 .5m-3 3 3 .5m6-3 3-.5m-3 4 3-.5" /></>,
  network: <><rect x="8" y="3" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/><rect x="15" y="16" width="7" height="5" rx="1"/><path d="M12 9v4M5.5 16v-3h13v3"/></>,
  device: <><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5M7 7h10m-10 4h6"/></>,
  support: <><path d="M4 14v-3a8 8 0 0 1 16 0v3M20 15v2a4 4 0 0 1-4 4h-3"/><rect x="2" y="10" width="4" height="7" rx="2"/><rect x="18" y="10" width="4" height="7" rx="2"/></>,
  administration: <><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 9h6m-6 4h6m-6 4h4"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  leaf: <><path d="M5 19C1 5 13 2 21 3c0 9-4 19-16 16Z"/><path d="M4 21 16 9"/></>,
};

export function Icon({ name, size = 22, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
