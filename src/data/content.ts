export type ServiceId = 'learning' | 'administration' | 'network' | 'devices' | 'support';

export interface Service {
  id: ServiceId;
  label: string;
  short: string;
  title: string;
  description: string;
  needs: string[];
  illustration: string;
}

export const services: Service[] = [
  {
    id: 'learning', label: 'Pembelajaran digital', short: 'Pembelajaran',
    title: 'Ruang belajar yang terus berkembang.',
    description: 'Dukung proses belajar dengan lingkungan digital yang menghubungkan guru, materi, dan kegiatan siswa.',
    needs: ['Platform pembelajaran & materi digital', 'Kelas kolaboratif dan asesmen', 'Integrasi perangkat pembelajaran'],
    illustration: 'Ruang belajar digital dengan materi, kegiatan kelas, dan asesmen',
  },
  {
    id: 'administration', label: 'Administrasi sekolah', short: 'Administrasi',
    title: 'Lebih tertata, dari awal hari.',
    description: 'Petakan kebutuhan administrasi agar informasi sekolah lebih mudah dikelola dan pekerjaan harian lebih terarah.',
    needs: ['Pengelolaan data dan informasi sekolah', 'Alur administrasi dan pelaporan', 'Kebutuhan integrasi antarsistem'],
    illustration: 'Ilustrasi pengelolaan jadwal, data sekolah, dan laporan',
  },
  {
    id: 'network', label: 'Jaringan & infrastruktur', short: 'Infrastruktur',
    title: 'Koneksi yang menjangkau setiap kelas.',
    description: 'Bangun fondasi digital sekolah dengan perencanaan jaringan, konektivitas, dan infrastruktur sesuai kondisi lapangan.',
    needs: ['Pemetaan jaringan dan cakupan Wi-Fi', 'Infrastruktur server dan konektivitas', 'Penataan serta pemeliharaan jaringan'],
    illustration: 'Ilustrasi jaringan yang menghubungkan kelas, kantor, dan perpustakaan',
  },
  {
    id: 'devices', label: 'Perangkat kelas', short: 'Perangkat',
    title: 'Teknologi yang hadir di ruang kelas.',
    description: 'Sesuaikan pilihan perangkat dengan cara mengajar, kebutuhan siswa, dan kesiapan ruang belajar.',
    needs: ['Perangkat komputer dan laboratorium', 'Layar interaktif dan presentasi', 'Perencanaan serta penataan perangkat'],
    illustration: 'Ilustrasi layar kelas interaktif, laptop, dan perangkat belajar',
  },
  {
    id: 'support', label: 'Pendampingan & dukungan', short: 'Pendampingan',
    title: 'Bertumbuh bersama, selangkah demi selangkah.',
    description: 'Teknologi menjadi bagian dari keseharian sekolah melalui persiapan, pengenalan, dan pendampingan penggunanya.',
    needs: ['Pemetaan kesiapan digital sekolah', 'Pengenalan teknologi untuk pendidik', 'Perencanaan dukungan berkelanjutan'],
    illustration: 'Ilustrasi sesi pendampingan dan rencana pengembangan sekolah',
  },
];

export const steps = [
  { title: 'Dengarkan kebutuhan', text: 'Mulai dari keseharian sekolah, tantangan yang dihadapi, dan tujuan yang ingin dicapai.' },
  { title: 'Rancang bersama', text: 'Susun pilihan teknologi dan prioritas yang sesuai dengan kesiapan sekolah.' },
  { title: 'Wujudkan bertahap', text: 'Rencanakan penerapan dengan memperhatikan kegiatan belajar yang sedang berjalan.' },
  { title: 'Tumbuh berkelanjutan', text: 'Dampingi penggunaan dan tinjau kembali kebutuhan seiring perkembangan sekolah.' },
];

export const faqs = [
  { q: 'Apa itu MangoTek Edu?', a: 'MangoTek Edu adalah organisasi pendidikan di bawah Mango Teknusa Inovasi yang mendukung kebutuhan digitalisasi dan infrastruktur pendidikan K–12, dari pembelajaran hingga operasional sekolah.' },
  { q: 'Untuk jenjang pendidikan apa?', a: 'Fokus MangoTek Edu adalah pendidikan K–12, dari taman kanak-kanak hingga jenjang menengah. Kebutuhan teknologi dipetakan sesuai usia peserta didik dan kondisi masing-masing sekolah.' },
  { q: 'Apakah sekolah harus mengganti seluruh sistem?', a: 'Pembahasan dimulai dari sistem dan perangkat yang sudah digunakan. Rancangan solusi dapat berfokus pada kebutuhan tertentu, integrasi, atau pengembangan secara bertahap.' },
  { q: 'Bagaimana memulai diskusi kebutuhan sekolah?', a: 'Gunakan tombol Diskusikan Kebutuhan untuk mencoba simulasi pemetaan layanan. Pada pratinjau ini, pilihan Anda hanya dirangkum di perangkat dan belum dikirim kepada tim MangoTek.' },
];
