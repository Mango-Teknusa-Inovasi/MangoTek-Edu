import { Icon } from './Icon';
import type { Service } from '../data/content';

export default function ServiceIllustration({ service }: { service: Service }) {
  const isNetwork = service.id === 'network';
  return <div className={`service-art art-${service.id}`} role="img" aria-label={service.illustration}>
    <div className="art-leaf" />
    {isNetwork ? <div className="network-map"><div className="network-hub"><Icon name="network" size={46}/><span>Jaringan sekolah</span></div><div className="network-branch branch-a"><Icon name="device"/><span>Ruang kelas</span></div><div className="network-branch branch-b"><Icon name="administration"/><span>Kantor sekolah</span></div><div className="network-branch branch-c"><Icon name="book"/><span>Perpustakaan</span></div><svg className="network-lines" viewBox="0 0 500 350"><path d="M250 155V70H110M250 155H390V110M250 155v130H150"/></svg></div> : <>
      <div className="art-window"><div className="art-window-header"><span className="mini-mark"><Icon name="leaf" size={17}/> MangoTek Edu</span><span>Ilustrasi layanan</span></div>
        <div className="art-window-main"><div className="art-sidebar"><span/><span/><span/></div><div className="art-content"><span className="art-greeting">{service.id === 'learning' ? 'Selamat datang di kelas.' : service.id === 'administration' ? 'Sekolah dalam satu ruang.' : service.id === 'devices' ? 'Siap untuk belajar bersama.' : 'Setiap langkah, didampingi.'}</span><div className="art-lesson"><Icon name={service.id === 'learning' ? 'book' : service.id === 'administration' ? 'administration' : service.id === 'devices' ? 'device' : 'support'} size={56}/><div><strong>{service.id === 'learning' ? 'Belajar. Pahami. Jelajahi.' : service.id === 'administration' ? 'Terencana dan tertata.' : service.id === 'devices' ? 'Ruang kelas interaktif.' : 'Bersama tim sekolah.'}</strong><span>{service.short} untuk sekolah</span></div></div><div className="art-bottom"><span>{service.id === 'learning' ? 'Materi belajar' : service.id === 'administration' ? 'Jadwal & kegiatan' : service.id === 'devices' ? 'Perangkat belajar' : 'Rencana pendampingan'}</span><Icon name="arrow" size={18}/></div></div></div>
      </div><div className="art-floating"><span className="art-check"><Icon name="check" size={18}/></span><div><strong>{service.id === 'learning' ? 'Belajar lebih terhubung' : service.id === 'administration' ? 'Informasi lebih tertata' : service.id === 'devices' ? 'Kelas siap berkembang' : 'Tumbuh bersama'}</strong><span>Dimulai dari kebutuhan sekolah</span></div></div>
    </>}
  </div>;
}
