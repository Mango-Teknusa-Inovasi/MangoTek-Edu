import { Children, isValidElement, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import AnimatedContent from './components/react-bits/AnimatedContent';
import DigitalStory from './components/DigitalStory';
import ConsultationDialog from './components/ConsultationDialog';
import InteractiveMedia from './components/InteractiveMedia';
import { Icon, type IconName } from './components/Icon';
import { type ServiceId } from './data/content';
import { usePortal } from './cms/PortalContext';
import { LatestNews } from './cms/News';

const serviceIcons: Record<ServiceId,IconName> = {learning:'book',administration:'administration',network:'network',devices:'device',support:'support'};


function Brand({ footer = false }: { footer?: boolean }) {
  const {identity}=usePortal();
  return <a className={`brand ${footer ? 'brand-footer' : ''}`} href="#beranda" aria-label="MangoTek Edu, kembali ke beranda"><img src={identity.logo} alt={identity.name} width="210" height="53"/></a>;
}

function OrderedSections({children}:{children:ReactNode}) {
 const {sections}=usePortal();const nodes=Children.toArray(children);return <>{nodes[0]}{sections.filter(s=>s.visible).map(s=>nodes.slice(1).find(n=>isValidElement<{id?:string}>(n)&&(n.props.id===s.id||(s.id==='berita'&&n.type===LatestNews))))}</>;
}

export default function App() {
  const portal=usePortal();const {services,steps,faqs}=portal;const navItems=portal.navigation.filter(item=>!item.href.startsWith('#')||portal.sections.some(s=>'#'+s.id===item.href&&s.visible));
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceId>('learning');
  const menuButton = useRef<HTMLButtonElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = services.find(s => s.id === selected)!;

  useEffect(() => {
    const onEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  const selectService = (id: ServiceId) => { setSelected(id); document.getElementById('layanan')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % services.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + services.length) % services.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = services.length - 1;
    else return;
    event.preventDefault(); setSelected(services[next].id); tabs.current[next]?.focus();
  };
  const consult = () => { setMenuOpen(false); setDialogOpen(true); };

  return <>
    <a className="skip-link" href="#main">Langsung ke konten</a>
    <header className="site-header"><div className="container header-inner">
      <Brand/>
      <nav className="desktop-nav" aria-label="Navigasi utama">{navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <button className="button button-green header-cta" onClick={consult}>{portal.headings.cta} <Icon name="diagonal" size={17}/></button>
      <button ref={menuButton} className="icon-button menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'}/></button>
    </div><nav id="mobile-navigation" className="mobile-nav" hidden={!menuOpen} aria-label="Navigasi ponsel">{navItems.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}<Icon name="arrow" size={18}/></a>)}<button className="button button-green" onClick={consult}>{portal.headings.cta}</button></nav></header>

    <main id="main"><OrderedSections>
      <DigitalStory onSelect={selectService}/>

      <section id="tentang" className="about-section section-space"><div className="container about-grid">
        <div><AnimatedContent distance={24} duration={0.7}><h2>{portal.about.title}</h2></AnimatedContent><InteractiveMedia kind={portal.about.media} compact/></div>
        <AnimatedContent distance={24} duration={0.7} delay={0.08}><div className="about-copy">{portal.about.paragraphs.map((p,i)=><p key={i}>{p}</p>)}<a href={portal.sections.find(s=>s.id==='pendekatan')?.visible?'#pendekatan':'/berita'} className="inline-link">Lihat cara kami mendampingi <Icon name="arrow" size={19}/></a></div></AnimatedContent>
      </div></section>

      <section id="layanan" className="services-section section-space"><div className="container">
        <div className="section-heading"><AnimatedContent distance={22}><h2>{portal.headings.services}</h2></AnimatedContent><p>{portal.headings.servicesIntro}</p></div>
        <div className="services-tabs" role="tablist" aria-label="Kategori layanan MangoTek">{services.map((service, index) => <button ref={el => { tabs.current[index] = el; }} id={`tab-${service.id}`} key={service.id} role="tab" aria-selected={selected === service.id} aria-controls={`panel-${service.id}`} tabIndex={selected === service.id ? 0 : -1} onClick={() => setSelected(service.id)} onKeyDown={e => onTabKey(e, index)}><Icon name={serviceIcons[service.id]} size={23}/><span>{service.label}</span></button>)}</div>
        {services.map(service => <div key={service.id} id={`panel-${service.id}`} role="tabpanel" aria-labelledby={`tab-${service.id}`} hidden={selected !== service.id} tabIndex={0} className="service-panel"><div className="service-detail"><span className="content-label">{service.label}</span><h3>{service.title}</h3><p>{service.description}</p><ul>{service.needs.map(need => <li key={need}><span className="list-leaf"/>{need}</li>)}</ul><button className="inline-link" onClick={consult}>Diskusikan kebutuhan ini <Icon name="arrow" size={19}/></button></div>{selected === service.id && <InteractiveMedia key={service.id} kind={service.id}/>}</div>)}
        <p className="draft-note">{portal.notes.services}</p>
      </div></section>

      <section id="pendekatan" className="approach-section section-space"><div className="container"><div className="approach-heading"><AnimatedContent distance={24}><h2>{portal.headings.approach}</h2></AnimatedContent><p>{portal.headings.approachIntro}</p><span className="approach-leaf" aria-hidden="true"><Icon name="leaf" size={88}/></span></div>
        <div className="approach-body"><InteractiveMedia kind={portal.media.approach}/><ol className="approach-steps">{steps.map((step, index) => <li key={step.title}><AnimatedContent distance={20} delay={index * 0.06}><div className="step-track"><span className={`step-node node-${index}`}>{index === 3 ? <Icon name="leaf" size={22}/> : <span/>}</span><span className="step-line"/></div><h3>{step.title}</h3><p>{step.text}</p></AnimatedContent></li>)}</ol></div>
        <p className="approach-note">{portal.notes.approach}</p>
      </div></section>

      <section id="faq" className="faq-section section-space"><div className="container faq-grid"><AnimatedContent distance={24}><div className="faq-intro"><span className="faq-symbol" aria-hidden="true">?</span><h2>{portal.headings.faq}</h2><p>{portal.headings.faqIntro}</p><InteractiveMedia kind={portal.media.faq} compact/></div></AnimatedContent><div className="faq-list">{faqs.map((faq, index) => <details key={faq.q} open={index === 0}><summary>{faq.q}<span><Icon name="plus" size={21}/></span></summary><p>{faq.a}</p></details>)}</div></div></section>

      <LatestNews/>
      <section id="kontak" className="contact-section"><div className="container"><div className="contact-panel"><div className="contact-copy"><AnimatedContent distance={20}><h2>{portal.headings.contact}</h2><p>{portal.headings.contactIntro}</p><button className="button button-mango" onClick={consult}>{portal.headings.cta} <Icon name="diagonal" size={18}/></button></AnimatedContent></div><div className="contact-media"><InteractiveMedia kind={portal.media.contact} dark/></div></div></div></section>
    </OrderedSections></main>
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-identity"><Brand footer/><p>{portal.identity.tagline}</p></div>
          <div className="footer-parent">
            <img src={portal.identity.parentLogo} alt={portal.identity.parentName} width="112" height="52"/>
            <span>Part of<strong>{portal.identity.parentName}</strong></span>
          </div>
        </div>
        <div className="footer-bottom">
          <nav aria-label="Navigasi footer">{navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
          <div className="footer-meta"><span>© {new Date().getFullYear()} {portal.identity.name}</span><a href="#beranda">Kembali ke atas <Icon name="arrow" size={16}/></a></div>
        </div>
      </div>
    </footer>
    <ConsultationDialog open={dialogOpen} onClose={() => setDialogOpen(false)}/>
    <span className="sr-only" aria-live="polite">Layanan terpilih: {current.label}</span>
  </>;
}
