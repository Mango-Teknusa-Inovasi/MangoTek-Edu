import { z } from "zod";
import { services, steps, faqs } from "../data/content";
import { chapters } from "../components/story-types";
const text = z.string().trim().min(1).max(5000);
const label = z.string().trim().min(1).max(180);
const asset = z
  .string()
  .regex(
    /^\/(?:uploads\/[a-f0-9-]+\.webp|brand\/[a-z-]+\.svg|[a-z-]+\.(?:png|svg))$/,
  );
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const httpsUrl = z.url().refine((v) => {
  try { const u = new URL(v); return u.protocol === "https:" && !u.username && !u.password; }
  catch { return false; }
}, "Gunakan URL HTTPS tanpa kredensial");
export const defaultSeo = {
  title: "MangoTek Edu | Digitalisasi Sekolah K–12",
  description: "MangoTek Edu mendukung digitalisasi sekolah K–12 melalui pembelajaran digital, administrasi, jaringan, perangkat kelas, dan pendampingan di Jawa Timur, Indonesia.",
  socialImage: "/social-card.png",
  socialImageAlt: "MangoTek Edu, sekolah terhubung dan pendidikan bertumbuh, dengan ilustrasi sekolah digital.",
  contactEmail: "billing@ppti.me",
  region: "Jawa Timur",
  country: "Indonesia",
  regionCode: "ID-JI",
};
const seoSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(350),
  socialImage: asset,
  socialImageAlt: z.string().trim().min(1).max(250),
  contactEmail: z.email(),
  region: label,
  country: label,
  regionCode: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/),
});
export const serviceIds = [
  "learning",
  "administration",
  "network",
  "devices",
  "support",
] as const;
export const mediaKinds = [
  "ecosystem",
  ...serviceIds,
  "implementation",
  "contact",
] as const;
export const sectionIds = [
  "tentang",
  "layanan",
  "pendekatan",
  "berita",
  "faq",
  "kontak",
] as const;
export const portalSchema = z.object({
  seo: seoSchema.default(defaultSeo),
  showcase: z.object({
    visible: z.boolean(),
    title: label,
    intro: text,
    trustTitle: label,
    partners: z.array(z.object({ name: label, logo: asset, url: z.union([httpsUrl, z.literal("")]) })).max(30),
  }).default({ visible: true, title: "Produk dan karya kami", intro: "Kenali produk dan penerapan teknologi yang telah kami kerjakan.", trustTitle: "Telah dipercaya oleh", partners: [] }),
  identity: z.object({
    name: label,
    logo: asset,
    parentLogo: asset,
    parentName: label,
    tagline: text,
  }),
  theme: z.object({ ink: color, background: color, accent: color }),
  navigation: z
    .array(
      z.object({
        label,
        href: z.enum([
          "#tentang",
          "#layanan",
          "#pendekatan",
          "#faq",
          "#kontak",
          "/berita",
          "/produk",
        ]),
      }),
    )
    .min(1)
    .max(7),
  sections: z
    .array(z.object({ id: z.enum(sectionIds), visible: z.boolean() }))
    .length(6)
    .refine(
      (a) => new Set(a.map((x) => x.id)).size === 6,
      "Setiap bagian harus unik",
    ),
  hero: z.object({
    eyebrow: label,
    title: text,
    subtitle: text,
    chapters: z.array(z.object({ label, title: text, text })).length(5),
    motion: z.boolean(),
    preset: z.enum(["interactive", "static"]),
  }),
  about: z.object({
    title: text,
    paragraphs: z.array(text).min(1).max(5),
    media: z.enum(mediaKinds),
  }),
  headings: z.object({
    services: text,
    servicesIntro: text,
    approach: text,
    approachIntro: text,
    faq: text,
    faqIntro: text,
    contact: text,
    contactIntro: text,
    cta: label,
  }),
  services: z
    .array(
      z.object({
        id: z.enum(serviceIds),
        label,
        short: label,
        title: text,
        description: text,
        needs: z.array(text).min(1).max(8),
        illustration: text,
      }),
    )
    .length(5)
    .refine((a) => new Set(a.map((x) => x.id)).size === 5),
  steps: z
    .array(z.object({ title: label, text }))
    .min(1)
    .max(8),
  faqs: z
    .array(z.object({ q: label, a: text }))
    .min(1)
    .max(15),
  media: z.object({
    approach: z.enum(mediaKinds),
    faq: z.enum(mediaKinds),
    contact: z.enum(mediaKinds),
  }),
  notes: z.object({
    services: z.string().max(500),
    approach: z.string().max(500),
  }),
});
export type PortalContent = z.infer<typeof portalSchema>;
export const defaultPortal: PortalContent = {
  seo: defaultSeo,
  showcase: { visible: true, title: "Produk dan karya kami", intro: "Kenali produk dan penerapan teknologi yang telah kami kerjakan.", trustTitle: "Telah dipercaya oleh", partners: [] },
  identity: {
    name: "MangoTek Edu",
    logo: "/brand/mangotek-edu.svg",
    parentLogo: "/mango-wordmark.png",
    parentName: "Mango Teknusa Inovasi",
    tagline: "Mendukung sekolah. Menumbuhkan masa depan.",
  },
  theme: { ink: "#1e4233", background: "#fffefa", accent: "#f6b74e" },
  navigation: [
    { href: "#tentang", label: "Tentang" },
    { href: "#layanan", label: "Layanan" },
    { href: "#pendekatan", label: "Pendekatan" },
    { href: "/berita", label: "Berita" },
    { href: "#faq", label: "FAQ" },
  ],
  sections: sectionIds.map((id) => ({ id, visible: true })),
  hero: {
    eyebrow: "Ruang untuk masa depan",
    title: "Sekolah terhubung.",
    subtitle: "Pendidikan bertumbuh.",
    chapters: chapters.map(({ label, title, text }) => ({
      label,
      title,
      text,
    })),
    motion: true,
    preset: "interactive",
  },
  about: {
    title: "Teknologi yang tumbuh bersama sekolah.",
    paragraphs: [
      "Setiap sekolah punya cerita, tantangan, dan langkahnya sendiri. Kami percaya perjalanan digital sebaiknya dimulai dari sana.",
      "MangoTek Edu, di bawah Mango Teknusa Inovasi, hadir untuk mendukung kebutuhan pendidikan K–12: menghubungkan pembelajaran, operasional, dan infrastruktur dalam satu pandangan.",
    ],
    media: "ecosystem",
  },
  headings: {
    services: "Satu ekosistem, untuk banyak kebutuhan.",
    servicesIntro: "Temukan titik awal yang tepat untuk sekolah Anda.",
    approach: "Langkah kecil. Arah yang berarti.",
    approachIntro:
      "Transformasi digital adalah perjalanan bersama. Kita mulai dari yang paling dibutuhkan.",
    faq: "Mari berkenalan lebih dekat.",
    faqIntro:
      "Beberapa hal tentang MangoTek Edu dan perjalanan digital sekolah.",
    contact: "Sekolah Anda, kemungkinan berikutnya.",
    contactIntro:
      "Mari mulai dari satu percakapan tentang kebutuhan sekolah Anda.",
    cta: "Diskusikan Kebutuhan",
  },
  services,
  steps,
  faqs: faqs.map((f, i) =>
    i === 3
      ? {
          ...f,
          a: "Isi formulir Diskusikan Kebutuhan. Tim MangoTek akan meninjau kebutuhan sekolah dan menghubungi Anda melalui kontak yang diberikan.",
        }
      : f,
  ),
  media: { approach: "implementation", faq: "support", contact: "contact" },
  notes: {
    services:
      "Gambaran layanan awal. Cakupan solusi disesuaikan melalui diskusi kebutuhan sekolah.",
    approach: "Pendekatan awal untuk dibahas bersama sekolah.",
  },
};
export const articleSchema = z
  .object({
    title: label,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    summary: text,
    cover: z.union([asset, z.literal("")]),
    coverAlt: z.string().max(250),
    category: label,
    blocks: z
      .array(
        z.object({ type: z.enum(["paragraph", "heading", "quote"]), text }),
      )
      .min(1)
      .max(100),
    seoTitle: z.string().max(180),
    seoDescription: z.string().max(350),
  })
  .refine(
    (a) => !a.cover || !!a.coverAlt.trim(),
    "Teks alternatif sampul wajib diisi",
  );
export type Article = z.infer<typeof articleSchema>;
export const productSchema = z.object({
  title: label,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  summary: text,
  category: label,
  cover: asset,
  coverAlt: label,
  blocks: z.array(z.object({ type: z.enum(["paragraph", "heading", "quote"]), text })).min(1).max(100),
  screenshots: z.array(z.object({ image: asset, alt: label, caption: z.string().max(500) })).max(20),
  videoUrl: z.union([httpsUrl.refine(v => { try { return /\.(mp4|webm)$/i.test(new URL(v).pathname); } catch { return false; } }, "Gunakan tautan langsung video MP4 atau WebM"), z.literal("")]),
  videoTranscript: z.string().max(15000),
  websiteUrl: z.union([httpsUrl, z.literal("")]),
  seoTitle: z.string().max(180),
  seoDescription: z.string().max(350),
}).refine(v => !v.videoUrl || v.videoTranscript.trim().length > 0, "Tambahkan transkrip atau deskripsi lengkap video");
export type Product = z.infer<typeof productSchema>;
export const inquirySchema = z
  .object({
    name: label,
    organization: label,
    email: z.union([z.email(), z.literal("")]).default(""),
    phone: z.string().max(30).default(""),
    services: z.array(z.enum(serviceIds)).min(1).max(5),
    message: z.string().trim().min(10).max(5000),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
    requestId: z.uuid(),
  })
  .refine(
    (v) => !!v.email || /^[+\d ()-]{8,30}$/.test(v.phone),
    "Isi email atau nomor WhatsApp yang valid",
  );
export type DocumentRecord<T = PortalContent | Article | Product> = {
  id: string;
  kind: "portal" | "article" | "product";
  revision: number;
  status: "draft" | "review" | "published";
  draft: T;
  published: T | null;
  updatedAt: string;
  publishedAt: string | null;
};
