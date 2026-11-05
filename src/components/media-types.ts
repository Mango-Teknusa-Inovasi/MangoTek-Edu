export type MediaKind = 'ecosystem' | 'learning' | 'administration' | 'network' | 'devices' | 'support' | 'implementation' | 'contact';
export const mediaContent: Record<MediaKind, { title: string; action: string; restore: string; detail: string }> = {
  ecosystem: { title: 'Sekolah dalam satu jaringan', action: 'Lihat koneksi', restore: 'Tutup koneksi', detail: 'Kelas, perpustakaan, dan kantor terhubung melalui jaringan sekolah.' },
  learning: { title: 'Ruang belajar digital', action: 'Buka laptop', restore: 'Tutup laptop', detail: 'Materi dan kegiatan kelas dapat diakses melalui ruang belajar digital.' },
  administration: { title: 'Informasi sekolah yang tertata', action: 'Pisahkan informasi', restore: 'Satukan informasi', detail: 'Jadwal, dokumen, dan informasi sekolah memiliki ruang pengelolaan masing-masing.' },
  network: { title: 'Infrastruktur yang saling terhubung', action: 'Lihat koneksi', restore: 'Tutup koneksi', detail: 'Perangkat jaringan menghubungkan titik akses di seluruh sekolah.' },
  devices: { title: 'Perangkat untuk setiap ruang belajar', action: 'Pisahkan perangkat', restore: 'Satukan perangkat', detail: 'Laptop, tablet, dan ponsel saling melengkapi sesuai kebutuhan pembelajaran.' },
  support: { title: 'Pendampingan untuk tim sekolah', action: 'Lihat dukungan', restore: 'Tutup dukungan', detail: 'Pendampingan mencakup panduan penggunaan dan pembahasan kebutuhan teknis.' },
  implementation: { title: 'Dari fondasi menuju ruang belajar', action: 'Uraikan lapisan', restore: 'Satukan lapisan', detail: 'Fondasi jaringan, perangkat, dan ruang pembelajaran dirancang sebagai satu kesatuan.' },
  contact: { title: 'Mulai dari kebutuhan sekolah', action: 'Jelajahi perangkat', restore: 'Satukan perangkat', detail: 'Pilih perangkat dan layanan melalui diskusi sesuai kebutuhan sekolah Anda.' },
};
