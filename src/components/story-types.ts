export type StoryChapter = 'school' | 'transition' | 'laptop' | 'devices' | 'ecosystem';
export type RenderQuality = 'mobile' | 'desktop';
export type StoryMode = 'loading' | 'interactive' | 'static';
export interface StoryInteraction { yaw: number; tilt: number; pointer: number; dragging: boolean; paused: boolean }
export const chapters: { id: StoryChapter; start: number; label: string; title: string; text: string }[] = [
  { id: 'school', start: 0, label: 'Sekolah', title: 'Sekolah terhubung. Pendidikan bertumbuh.', text: 'Dari ruang kelas hingga infrastruktur, MangoTek Edu mendampingi sekolah membangun ekosistem digital yang saling terhubung.' },
  { id: 'transition', start: .2, label: 'Keseharian', title: 'Digitalisasi dimulai dari keseharian sekolah.', text: 'Dari menyiapkan materi hingga berbagi informasi. Teknologi hadir untuk membantu setiap langkahnya.' },
  { id: 'laptop', start: .4, label: 'Ruang mengajar', title: 'Ruang mengajar yang lebih terhubung.', text: 'Materi, aktivitas kelas, dan pengelolaan pembelajaran dalam satu ruang digital.' },
  { id: 'devices', start: .65, label: 'Lintas perangkat', title: 'Belajar dan berkomunikasi, lintas perangkat.', text: 'Di kelas maupun di rumah. Informasi sekolah dapat dijangkau dari perangkat yang digunakan sehari-hari.' },
  { id: 'ecosystem', start: .85, label: 'Ekosistem', title: 'Satu ekosistem untuk kebutuhan sekolah.', text: 'Pembelajaran, administrasi, perangkat, dan jaringan. Dirancang agar saling mendukung.' },
];
