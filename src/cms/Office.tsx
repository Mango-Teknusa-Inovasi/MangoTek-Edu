import { useEffect, useState, type FormEvent } from "react";
import { api, send } from "./client";
import {
  MediaField,
  MediaProvider,
  useMediaPending,
  type MediaAsset,
} from "./media";
import {
  defaultPortal,
  mediaKinds,
  type DocumentRecord,
  type Article,
  type Product,
  type PortalContent,
} from "./schema";
type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
  revision: number;
};
const labels: Record<string, string> = {
  seo: "SEO, kontak, dan wilayah",
  socialImage: "Gambar berbagi sosial",
  socialImageAlt: "Deskripsi gambar sosial",
  contactEmail: "Email pemasaran",
  region: "Provinsi atau wilayah",
  country: "Negara",
  regionCode: "Kode wilayah ISO (contoh ID-JI)",
  showcase: "Portofolio dan organisasi yang mempercayai kami",
  intro: "Pengantar",
  trustTitle: "Judul bagian kepercayaan",
  partners: "Organisasi (isi hanya dengan izin publikasi)",
  url: "Website organisasi (HTTPS, opsional)",
  screenshots: "Galeri tangkapan layar",
  image: "Gambar",
  alt: "Teks alternatif",
  caption: "Keterangan gambar",
  videoUrl: "Tautan langsung video MP4/WebM (HTTPS, opsional)",
  videoTranscript: "Transkrip dan deskripsi lengkap video",
  websiteUrl: "Website produk (HTTPS, opsional)",
  identity: "Identitas",
  name: "Nama",
  logo: "Logo Edu",
  parentLogo: "Logo induk",
  parentName: "Nama induk",
  tagline: "Tagline",
  theme: "Warna",
  ink: "Teks utama",
  background: "Latar",
  accent: "Aksen",
  navigation: "Navigasi",
  label: "Label",
  href: "Tujuan tautan",
  sections: "Susunan bagian",
  visible: "Tampilkan bagian",
  hero: "Hero dan cerita digital",
  eyebrow: "Pengantar",
  title: "Judul",
  subtitle: "Judul lanjutan",
  chapters: "Babak cerita",
  text: "Teks",
  motion: "Aktifkan gerakan",
  preset: "Mode visual",
  about: "Tentang",
  paragraphs: "Paragraf",
  media: "Media 3D",
  headings: "Judul dan ajakan",
  services: "Layanan",
  servicesIntro: "Pengantar layanan",
  approach: "Pendekatan",
  approachIntro: "Pengantar pendekatan",
  faq: "FAQ",
  faqIntro: "Pengantar FAQ",
  contact: "Konsultasi",
  contactIntro: "Pengantar konsultasi",
  cta: "Tombol konsultasi",
  short: "Nama pendek",
  description: "Penjelasan",
  needs: "Contoh kebutuhan",
  illustration: "Deskripsi ilustrasi",
  steps: "Langkah pendekatan",
  faqs: "Pertanyaan umum",
  q: "Pertanyaan",
  a: "Jawaban",
  notes: "Catatan",
  summary: "Ringkasan",
  slug: "Slug halaman",
  cover: "Gambar sampul",
  coverAlt: "Teks alternatif sampul",
  category: "Kategori",
  blocks: "Isi artikel",
  type: "Jenis blok",
  seoTitle: "Judul SEO",
  seoDescription: "Deskripsi SEO",
};
const statusLabels: Record<string, string> = {
  draft: "Draf",
  review: "Menunggu tinjauan",
  published: "Terbit",
  new: "Baru",
  processing: "Diproses",
  done: "Selesai",
};
const sectionHelp: Record<string, string> = {
  Ringkasan: "Mulai dari pekerjaan yang perlu Anda tangani hari ini.",
  "Konten Portal":
    "Sunting satu bagian, simpan draf, lalu terbitkan saat siap.",
  Berita: "Kelola kabar sekolah, kegiatan, dan artikel yang tampil di portal.",
  Produk: "Tampilkan produk dan karya melalui cerita, gambar, dan video.",
  Media: "Simpan gambar yang dapat digunakan kembali di seluruh portal.",
  Konsultasi: "Baca kebutuhan sekolah dan catat tindak lanjutnya.",
  Laporan: "Tinjau permintaan menurut periode, layanan, dan status.",
  Pengguna: "Kelola akses admin dan editor organisasi Anda.",
  Pengaturan: "Atur identitas, navigasi, warna, dan informasi pencarian.",
};
const fieldHelp: Record<string, string> = {
  hero: "Judul pembuka, cerita digital, dan pengaturan gerakan.",
  about: "Perkenalan organisasi dan dukungan untuk sekolah.",
  headings: "Judul bagian dan ajakan yang tampil di beranda.",
  services: "Deskripsi layanan dan contoh kebutuhan sekolah.",
  steps: "Langkah kerja dari perencanaan hingga pendampingan.",
  faqs: "Pertanyaan dan jawaban yang membantu pengunjung.",
  showcase: "Pengantar portofolio dan logo organisasi dengan izin publikasi.",
  sections: "Urutan dan visibilitas bagian setelah hero.",
  media: "Pilihan objek 3D untuk setiap bagian portal.",
  notes: "Catatan yang ditampilkan kepada pengunjung.",
  identity: "Nama, logo, dan hubungan dengan organisasi induk.",
  theme: "Warna dasar yang digunakan pada portal publik.",
  navigation: "Label dan tujuan tautan pada menu portal.",
  seo: "Judul pencarian, gambar sosial, kontak, dan wilayah layanan.",
};
const iconPaths: Record<string, string> = {
  Ringkasan: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  "Konten Portal": "M3 4h18v16H3zM3 9h18M9 9v11",
  Berita: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
  Produk: "m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9",
  Media: "M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M16 8h.01",
  Konsultasi: "M4 4h16v12H9l-5 4V4Zm4 4h8M8 12h5",
  Laporan: "M4 3v18h17M9 16v-5M14 16V6M19 16V9",
  Pengguna:
    "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-3.87",
  Pengaturan: "M4 7h16M4 17h16M9 4v6M15 14v6",
};
function OfficeIcon({ name }: { name: string }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name] || iconPaths.Berita} />
    </svg>
  );
}
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusLabels[status] || status}
    </span>
  );
}
function Field({
  value,
  onChange,
  path,
  assets,
  disabled = false,
}: {
  value: any;
  onChange: (value: any) => void;
  path: string;
  assets: any[];
  disabled?: boolean;
}) {
  const key = path.split(".").pop()!,
    caption =
      key === "logo" && path.startsWith("showcase.partners.")
        ? "Logo organisasi"
        : labels[key] || key;
  if (key === "id") return <p className="field-help">Bagian: {value}</p>;
  if (Array.isArray(value)) {
    const fixed = ["sections", "services", "chapters"].includes(key),
      reorder =
        key === "sections" ||
        [
          "steps",
          "faqs",
          "navigation",
          "blocks",
          "paragraphs",
          "needs",
          "screenshots",
          "partners",
        ].includes(key);
    const add = () => {
      const templates: any = {
        navigation: { label: "Tautan baru", href: "/berita" },
        steps: { title: "Langkah baru", text: "" },
        faqs: { q: "Pertanyaan baru", a: "" },
        blocks: { type: "paragraph", text: "" },
        screenshots: { image: "", alt: "", caption: "" },
        partners: { name: "", logo: "", url: "" },
      };
      onChange([...value, templates[key] ?? ""]);
    };
    return (
      <fieldset className="editor-array" disabled={disabled}>
        <legend>{caption}</legend>
        {value.map((v, i) => {
          const Item = v && typeof v === "object" ? "details" : "div";
          const itemTitle =
            v && typeof v === "object"
              ? v.label || v.title || v.q || v.name || `${caption} ${i + 1}`
              : "";
          return (
            <Item
              className="editor-item"
              key={i}
              {...(Item === "details" ? { open: i === 0 } : {})}
            >
              {Item === "details" && (
                <summary className="editor-item-summary">{itemTitle}</summary>
              )}
              <div className="item-toolbar">
                <span>{i + 1}</span>
                {reorder && (
                  <>
                    <button
                      type="button"
                      disabled={i === 0}
                      aria-label={`Naikkan ${caption} ${i + 1}`}
                      onClick={() => {
                        const next = [...value];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        onChange(next);
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === value.length - 1}
                      aria-label={`Turunkan ${caption} ${i + 1}`}
                      onClick={() => {
                        const next = [...value];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        onChange(next);
                      }}
                    >
                      ↓
                    </button>
                  </>
                )}
                {!fixed && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(value.filter((_: any, j: number) => j !== i))
                    }
                  >
                    Hapus
                  </button>
                )}
              </div>
              <Field
                value={v}
                onChange={(n) =>
                  onChange((current: any[]) =>
                    current.map((x: any, j: number) =>
                      j === i ? (typeof n === "function" ? n(x) : n) : x,
                    ),
                  )
                }
                path={`${path}.${i}`}
                assets={assets}
                disabled={disabled}
              />
            </Item>
          );
        })}
        {!fixed && (
          <button type="button" onClick={add}>
            Tambah {caption.toLowerCase()}
          </button>
        )}
      </fieldset>
    );
  }
  if (value && typeof value === "object")
    return (
      <div className="editor-group">
        {Object.entries(value).map(([k, v]) => (
          <Field
            key={k}
            value={v}
            onChange={(n) =>
              onChange((current: any) => ({
                ...current,
                [k]: typeof n === "function" ? n(current[k]) : n,
              }))
            }
            path={`${path}.${k}`}
            assets={assets}
            disabled={disabled}
          />
        ))}
      </div>
    );
  if (typeof value === "boolean")
    return (
      <label className="checkbox-field">
        <input
          disabled={disabled}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {caption}
      </label>
    );
  let choices: readonly string[] | undefined;
  if (key === "preset") choices = ["interactive", "static"];
  if (key === "type") choices = ["paragraph", "heading", "quote"];
  if (key === "href")
    choices = [
      "#tentang",
      "#layanan",
      "#pendekatan",
      "#faq",
      "#kontak",
      "/berita",
      "/produk",
    ];
  if (key === "media" || path.startsWith("media.")) choices = mediaKinds;
  if (choices)
    return (
      <label>
        {caption}
        <select
          aria-label={caption}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {choices.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    );
  if (["logo", "parentLogo", "cover", "image", "socialImage"].includes(key))
    return (
      <MediaField
        caption={caption}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  if (path.startsWith("theme."))
    return (
      <label>
        {caption}
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  const long =
    [
      "text",
      "a",
      "description",
      "summary",
      "message",
      "contactIntro",
      "servicesIntro",
      "approachIntro",
      "faqIntro",
    ].includes(key) ||
    (typeof value === "string" && value.length > 130) ||
    /^\d+$/.test(key);
  return (
    <label>
      {/^\d+$/.test(key) ? "Teks" : caption}
      {long ? (
        <textarea
          disabled={disabled}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function ContentEditor({
  record,
  admin,
  settings,
  refresh,
  assets,
  onDirtyChange,
  onSaved,
}: {
  record: DocumentRecord;
  admin: boolean;
  settings: boolean;
  refresh: () => void;
  assets: any[];
  onDirtyChange: (dirty: boolean) => void;
  onSaved: (record: DocumentRecord) => void;
}) {
  const [draft, setDraft] = useState<any>(record.draft),
    [revision, setRevision] = useState(record.revision),
    [status, setStatus] = useState(record.status),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false),
    [activeField, setActiveField] = useState(settings ? "identity" : "hero");
  const uploading = useMediaPending();
  useEffect(() => {
    onDirtyChange(dirty || uploading);
  }, [dirty, uploading, onDirtyChange]);
  const article = record.kind !== "portal",
    isNew = record.id === "new";
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const save = async () => {
    if (uploading) return;
    setMessage("");
    setFailed(false);
    setBusy(true);
    try {
      if (isNew) {
        await api(
          "/api/office/documents",
          send("POST", { ...draft, kind: record.kind }),
        );
        setDirty(false);
        onDirtyChange(false);
        refresh();
      } else {
        const next = await api(
          `/api/office/documents/${record.id}`,
          send("PUT", { revision, content: draft }),
        );
        onSaved(next);
        setRevision(next.revision);
        setStatus(next.status);
        setDirty(false);
        setMessage("Draf tersimpan.");
      }
    } catch (e) {
      setFailed(true);
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const action = async (action: string) => {
    setFailed(false);
    setBusy(true);
    setMessage("");
    try {
      const r = await api(
        `/api/office/documents/${record.id}/${action}`,
        send("POST", { revision }),
      );
      onSaved(r);
      setRevision(r.revision);
      setStatus(r.status);
      setMessage(
        action === "publish"
          ? "Konten telah diterbitkan."
          : action === "review"
            ? "Draf diajukan untuk ditinjau."
            : "Konten ditarik dari publikasi.",
      );
    } catch (e) {
      setFailed(true);
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const fieldOrder = [
    "identity",
    "theme",
    "navigation",
    "seo",
    "hero",
    "about",
    "headings",
    "services",
    "steps",
    "faqs",
    "showcase",
    "sections",
    "media",
    "notes",
  ];
  const fields = Object.keys(draft)
    .sort((a, b) => fieldOrder.indexOf(a) - fieldOrder.indexOf(b))
    .filter((k) =>
      article || settings
        ? article || ["identity", "theme", "navigation", "seo"].includes(k)
        : !["identity", "theme", "navigation", "seo"].includes(k),
    );
  return (
    <div className="content-editor" aria-busy={busy}>
      <div className="editor-status">
        <div className="editor-state">
          <StatusBadge status={status} />
          <span>Versi {revision}</span>
          <span className={dirty ? "save-state is-dirty" : "save-state"}>
            {dirty
              ? "Modifikasi belum disimpan"
              : isNew
                ? "Belum disimpan"
                : "Draf tersimpan"}
          </span>
        </div>
        {!isNew && (
          <a
            href={`/office/preview/${record.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Pratinjau draf tersimpan ↗
          </a>
        )}
      </div>
      <p className="field-help">
        Simpan perubahan sebagai draf sebelum meninjau atau menerbitkan.
      </p>
      <form
        className={article ? "document-editor-form" : "portal-editor-form"}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {!article && (
          <nav className="editor-section-nav" aria-label="Bagian editor">
            <span className="editor-nav-label">BAGIAN HALAMAN</span>
            {fields.map((k) => (
              <button
                key={k}
                type="button"
                aria-current={activeField === k ? "true" : undefined}
                onClick={() => setActiveField(k)}
              >
                {labels[k] || k}
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </nav>
        )}
        <fieldset disabled={busy} className="editor-fields">
          {article
            ? [
                {
                  title: "Informasi utama",
                  keys: ["title", "slug", "summary", "category"],
                },
                {
                  title: "Gambar dan media",
                  keys: [
                    "cover",
                    "coverAlt",
                    "screenshots",
                    "videoUrl",
                    "videoTranscript",
                    "websiteUrl",
                  ],
                },
                { title: "Isi halaman", keys: ["blocks"] },
                {
                  title: "Tampilan di pencarian",
                  keys: ["seoTitle", "seoDescription"],
                },
              ].map((group) => (
                <section className="editor-section" key={group.title}>
                  <div className="editor-section-heading">
                    <h2>{group.title}</h2>
                  </div>
                  <div className="editor-group">
                    {group.keys
                      .filter((k) => fields.includes(k))
                      .map((k) => (
                        <Field
                          key={k}
                          path={k}
                          value={draft[k]}
                          onChange={(value) => {
                            setDraft((current: any) => ({
                              ...current,
                              [k]:
                                typeof value === "function"
                                  ? value(current[k])
                                  : value,
                            }));
                            setDirty(true);
                          }}
                          assets={assets}
                          disabled={busy}
                        />
                      ))}
                  </div>
                </section>
              ))
            : fields
                .filter((k) => k === activeField)
                .map((k) => (
                  <section
                    className="editor-section"
                    key={k}
                    aria-labelledby={`editor-${k}`}
                  >
                    <div className="editor-section-heading">
                      <h2 id={`editor-${k}`}>{labels[k] || k}</h2>
                      {fieldHelp[k] && <p>{fieldHelp[k]}</p>}
                    </div>
                    <Field
                      path={k}
                      value={draft[k]}
                      onChange={(value) => {
                        setDraft((current: any) => ({
                          ...current,
                          [k]:
                            typeof value === "function"
                              ? value(current[k])
                              : value,
                        }));
                        setDirty(true);
                      }}
                      assets={assets}
                      disabled={busy}
                    />
                  </section>
                ))}
        </fieldset>
        <div className="editor-actions editor-savebar">
          <button className="button button-green" disabled={busy || uploading}>
            {uploading
              ? "Menunggu unggahan…"
              : busy
                ? "Memproses…"
                : "Simpan draf"}
          </button>
          {!isNew && (
            <>
              <button
                type="button"
                disabled={busy || uploading || dirty}
                onClick={() => action("review")}
              >
                Ajukan tinjauan
              </button>
              {admin && (
                <button
                  type="button"
                  disabled={busy || uploading || dirty}
                  onClick={() => action("publish")}
                >
                  Terbitkan
                </button>
              )}
              {admin && article && record.published && (
                <button
                  type="button"
                  disabled={busy || uploading || dirty}
                  onClick={() => action("unpublish")}
                >
                  Tarik publikasi
                </button>
              )}
            </>
          )}
          <span className="savebar-hint">
            {dirty
              ? "Simpan draf untuk mengaktifkan publikasi."
              : "Perubahan tampil di portal setelah diterbitkan."}
          </span>
        </div>
      </form>
      {message && (
        <p
          className={`office-notice editor-feedback ${failed ? "is-error" : "is-success"}`}
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </div>
  );
}
const blankArticle: Article = {
  title: "Berita baru",
  slug: "berita-baru",
  summary: "",
  cover: "",
  coverAlt: "",
  category: "Kegiatan",
  blocks: [{ type: "paragraph", text: "" }],
  seoTitle: "",
  seoDescription: "",
};
const blankProduct: Product = {
  title: "Produk baru",
  slug: "produk-baru",
  summary: "",
  category: "Produk pendidikan",
  cover: "",
  coverAlt: "",
  blocks: [{ type: "paragraph", text: "" }],
  screenshots: [],
  videoUrl: "",
  videoTranscript: "",
  websiteUrl: "",
  seoTitle: "",
  seoDescription: "",
};
function Inquiries({
  report,
  onError,
}: {
  report: boolean;
  onError: (s: string) => void;
}) {
  const [rows, setRows] = useState<any[]>([]),
    [filters, setFilters] = useState({
      from: "",
      to: "",
      status: "",
      service: "",
    }),
    [selected, setSelected] = useState<any>(null),
    [busy, setBusy] = useState(false);
  const query = new URLSearchParams(filters).toString();
  const load = (signal?: AbortSignal) =>
    api(`/api/office/inquiries?${query}`, { signal })
      .then(setRows)
      .catch((e) => {
        if (!signal?.aborted) onError(e.message);
      });
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [query]);
  return (
    <>
      <div className="office-filters">
        <label>
          Dari tanggal
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </label>
        <label>
          Sampai tanggal
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Semua status</option>
            {["new", "processing", "done"].map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Layanan
          <select
            value={filters.service}
            onChange={(e) =>
              setFilters({ ...filters, service: e.target.value })
            }
          >
            <option value="">Semua layanan</option>
            {defaultPortal.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {report && (
        <>
          <div className="report-totals">
            <div>
              <strong>{rows.length}</strong>
              <span>Total permintaan</span>
            </div>
            {["new", "processing", "done"].map((s) => (
              <div key={s}>
                <strong>{rows.filter((r) => r.status === s).length}</strong>
                <span>{statusLabels[s]}</span>
              </div>
            ))}
          </div>
          <h2>Menurut layanan</h2>
          <ul className="service-report">
            {defaultPortal.services.map((s) => (
              <li key={s.id}>
                {s.label}
                <strong>
                  {rows.filter((r) => r.services.includes(s.id)).length}
                </strong>
              </li>
            ))}
          </ul>
          <a
            className="button button-green"
            href={`/api/office/reports.csv?${query}`}
          >
            Unduh laporan CSV
          </a>
          <p className="field-help">
            Jumlah per layanan dapat melebihi total karena satu permintaan dapat
            memilih beberapa layanan.
          </p>
        </>
      )}
      <div className="office-list">
        {!rows.length ? (
          <p>Belum ada permintaan pada filter ini.</p>
        ) : (
          rows.map((r) => (
            <button
              className="list-row"
              key={r.id}
              onClick={() => setSelected({ ...r })}
            >
              <span>
                <strong>{r.organization}</strong>
                <small>
                  {r.name} ·{" "}
                  {new Date(r.created_at).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                  })}
                </small>
              </span>
              <StatusBadge status={r.status} />
            </button>
          ))
        )}
      </div>
      {selected && (
        <section className="inquiry-detail">
          <div className="office-heading">
            <h2>{selected.organization}</h2>
            <button onClick={() => setSelected(null)}>Tutup detail</button>
          </div>
          <dl>
            <dt>Nama</dt>
            <dd>{selected.name}</dd>
            <dt>Kontak</dt>
            <dd>
              {selected.email || "—"} · {selected.phone || "—"}
            </dd>
            <dt>Kebutuhan</dt>
            <dd>
              {selected.services
                .map(
                  (id: string) =>
                    defaultPortal.services.find((s) => s.id === id)?.label,
                )
                .join(", ")}
            </dd>
          </dl>
          <p className="preserve-lines">{selected.message}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api(
                  `/api/office/inquiries/${selected.id}`,
                  send("PUT", {
                    status: selected.status,
                    notes: selected.notes,
                    revision: selected.revision,
                  }),
                );
                setSelected({ ...selected, revision: selected.revision + 1 });
                await load();
                onError("Perubahan permintaan tersimpan.");
              } catch (e) {
                onError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Status
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected({ ...selected, status: e.target.value })
                }
              >
                {["new", "processing", "done"].map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Catatan internal
              <textarea
                rows={4}
                value={selected.notes}
                onChange={(e) =>
                  setSelected({ ...selected, notes: e.target.value })
                }
              />
            </label>
            <div className="editor-actions">
              <button className="button button-green" disabled={busy}>
                Simpan tindak lanjut
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(
                      "Hapus permintaan beserta data kontaknya secara permanen?",
                    )
                  )
                    return;
                  try {
                    await api(
                      `/api/office/inquiries/${selected.id}`,
                      send("DELETE"),
                    );
                    setSelected(null);
                    load();
                  } catch (e) {
                    onError((e as Error).message);
                  }
                }}
              >
                Hapus permintaan
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
function Users({ onError }: { onError: (s: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const load = () =>
    api("/api/office/users")
      .then(setUsers)
      .catch((e) => onError(e.message));
  useEffect(() => {
    load();
  }, []);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      await api(
        "/api/office/users",
        send("POST", Object.fromEntries(new FormData(f))),
      );
      f.reset();
      load();
      onError("Pengguna ditambahkan.");
    } catch (e) {
      onError((e as Error).message);
    }
  };
  return (
    <>
      <h2>Tambah pengguna</h2>
      <form className="user-form" onSubmit={submit}>
        <label>
          Nama
          <input name="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Peran
          <select name="role">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Kata sandi awal
          <input
            name="password"
            type="password"
            minLength={12}
            required
            autoComplete="new-password"
          />
        </label>
        <button className="button button-green">Tambah pengguna</button>
      </form>
      <h2>Akun portal</h2>
      {users.map((u) => (
        <form
          className="user-row"
          key={u.id}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.currentTarget,
              data = new FormData(f);
            try {
              await api(
                `/api/office/users/${u.id}`,
                send("PUT", {
                  active: data.get("active") === "on",
                  revision: u.revision,
                  ...(data.get("password")
                    ? { password: data.get("password") }
                    : {}),
                }),
              );
              f.reset();
              load();
              onError("Akun diperbarui. Sesi lama telah diakhiri.");
            } catch (e) {
              onError((e as Error).message);
            }
          }}
        >
          <div>
            <strong>{u.name}</strong>
            <p>
              {u.email} · {u.role}
            </p>
          </div>
          <label className="checkbox-field">
            <input type="checkbox" name="active" defaultChecked={!!u.active} />
            Aktif
          </label>
          <label>
            Kata sandi baru (opsional)
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
            />
          </label>
          <button>Simpan akun</button>
        </form>
      ))}
    </>
  );
}
function matchesDocument(
  d: DocumentRecord,
  kind: string,
  search: string,
  status: string,
) {
  const content = d.draft as Article;
  return (
    d.kind === kind &&
    (!status || d.status === status) &&
    `${content.title} ${content.category}`
      .toLocaleLowerCase("id")
      .includes(search.toLocaleLowerCase("id").trim())
  );
}
function Overview({
  docs,
  admin,
  name,
  navigate,
}: {
  docs: DocumentRecord[];
  admin: boolean;
  name: string;
  navigate: (section: string) => void;
}) {
  const content = docs.filter((d) => d.kind !== "portal");
  const review = docs.filter((d) => d.status === "review");
  const shortcuts = admin
    ? ["Konten Portal", "Berita", "Produk", "Konsultasi"]
    : ["Konten Portal", "Berita", "Produk", "Media"];
  return (
    <div className="office-overview">
      <section className="workspace-welcome">
        <div>
          <span className="office-kicker">MANGOTEK EDU · OFFICE</span>
          <h2>Selamat bekerja, {name}.</h2>
          <p>
            Rawat informasi portal dan bantu sekolah menemukan dukungan yang
            tepat.
          </p>
        </div>
        <a href="/" target="_blank" rel="noreferrer">
          Buka portal <span aria-hidden="true">↗</span>
        </a>
      </section>
      <section className="workspace-metrics" aria-label="Ringkasan konten">
        {[
          {
            label: "Berita",
            value: content.filter((d) => d.kind === "article").length,
            section: "Berita",
          },
          {
            label: "Produk & portofolio",
            value: content.filter((d) => d.kind === "product").length,
            section: "Produk",
          },
          {
            label: "Menunggu tinjauan",
            value: review.length,
            section:
              review[0]?.kind === "product"
                ? "Produk"
                : review[0]?.kind === "article"
                  ? "Berita"
                  : "Konten Portal",
          },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.section)}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <span className="metric-link">
              Lihat konten <span aria-hidden="true">↗</span>
            </span>
          </button>
        ))}
      </section>
      <section className="workspace-shortcuts">
        <h2>Apa yang ingin Anda kerjakan?</h2>
        <div>
          {shortcuts.map((section) => (
            <button key={section} onClick={() => navigate(section)}>
              <OfficeIcon name={section} />
              <span>
                <strong>{section}</strong>
                <small>{sectionHelp[section]}</small>
              </span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>
      <section className="workspace-recent">
        <div className="office-heading">
          <div>
            <h2>Konten terakhir diperbarui</h2>
            <p>Draf tetap tersimpan untuk dilanjutkan kapan saja.</p>
          </div>
        </div>
        <div className="office-list">
          {docs.slice(0, 5).map((d) => (
            <button
              className="list-row"
              key={d.id}
              onClick={() =>
                navigate(
                  d.kind === "portal"
                    ? "Konten Portal"
                    : d.kind === "product"
                      ? "Produk"
                      : "Berita",
                )
              }
            >
              <span>
                <strong>
                  {d.kind === "portal"
                    ? "Beranda MangoTek Edu"
                    : (d.draft as Article).title}
                </strong>
                <small>
                  {d.kind === "portal"
                    ? "Konten Portal"
                    : d.kind === "product"
                      ? "Produk"
                      : "Berita"}
                  {d.updatedAt &&
                    ` · ${new Date(d.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}`}
                </small>
              </span>
              <StatusBadge status={d.status} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
export default function Office() {
  const [session, setSession] = useState<{ user: User } | null>(null),
    [loading, setLoading] = useState(true),
    [section, setSection] = useState("Ringkasan"),
    [message, setMessage] = useState(""),
    [docs, setDocs] = useState<DocumentRecord[]>([]),
    [assets, setAssets] = useState<MediaAsset[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [newArticle, setNewArticle] = useState(false),
    [busy, setBusy] = useState(false),
    [dataLoading, setDataLoading] = useState(true),
    [dirty, setDirty] = useState(false),
    [search, setSearch] = useState(""),
    [statusFilter, setStatusFilter] = useState("");
  const navigate = (next: string) => {
    if (next === section && !selected && !newArticle) return;
    if (
      dirty &&
      !window.confirm("Perubahan belum disimpan. Tinggalkan halaman ini?")
    )
      return;
    setDirty(false);
    setSection(next);
    setSelected(null);
    setNewArticle(false);
    setSearch("");
    setStatusFilter("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const load = () =>
    Promise.all([api("/api/office/documents"), api("/api/office/media")])
      .then(([d, m]) => {
        setDocs(d);
        setAssets(m);
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setDataLoading(false));
  useEffect(() => {
    api("/api/office/session")
      .then(setSession)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (session) load();
  }, [session]);
  if (loading) return <p className="loading-page">Memuat office…</p>;
  if (!session)
    return (
      <main className="office-login">
        <a href="/">
          <img src="/brand/mangotek-edu.svg" alt="MangoTek Edu" />
        </a>
        <h1>Masuk ke office</h1>
        <p>Kelola konten dan kebutuhan sekolah.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            try {
              setSession(
                await api(
                  "/api/login",
                  send(
                    "POST",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  ),
                ),
              );
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <label>
            Kata sandi
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button className="button button-green" disabled={busy}>
            {busy ? "Memeriksa…" : "Masuk"}
          </button>
          {message && <p role="alert">{message}</p>}
        </form>
        <a href="/">← Kembali ke portal</a>
      </main>
    );
  const admin = session.user.role === "admin";
  const menu = admin
    ? [
        "Ringkasan",
        "Konten Portal",
        "Berita",
        "Produk",
        "Media",
        "Konsultasi",
        "Laporan",
        "Pengguna",
        "Pengaturan",
      ]
    : ["Ringkasan", "Konten Portal", "Berita", "Produk", "Media"];
  const documentKind = section === "Produk" ? "product" : "article";
  const record =
    section === "Berita" || section === "Produk"
      ? newArticle
        ? ({
            id: "new",
            kind: documentKind,
            draft: documentKind === "product" ? blankProduct : blankArticle,
            published: null,
            status: "draft",
            revision: 0,
            updatedAt: "",
            publishedAt: null,
          } as DocumentRecord)
        : docs.find((d) => d.id === selected)
      : docs.find((d) => d.id === "portal");
  return (
    <MediaProvider
      assets={assets}
      add={(asset) =>
        setAssets((current) => [
          asset,
          ...current.filter((a) => a.id !== asset.id),
        ])
      }
    >
      <div className="office-shell">
        <a className="skip-link" href="#office-main">
          Langsung ke konten office
        </a>
        <aside className="office-sidebar">
          <a href="/">
            <img src="/brand/mangotek-edu.svg" alt="MangoTek Edu" />
          </a>
          <span className="office-label">RUANG KERJA</span>
          <nav aria-label="Menu office">
            {menu.map((s) => (
              <button
                key={s}
                aria-current={section === s ? "page" : undefined}
                onClick={() => navigate(s)}
              >
                <OfficeIcon name={s} />
                <span>{s}</span>
              </button>
            ))}
          </nav>
          <div className="office-account">
            <strong>{session.user.name}</strong>
            <span>{admin ? "Admin" : "Editor"}</span>
            <button
              onClick={async () => {
                if (
                  dirty &&
                  !window.confirm("Perubahan belum disimpan. Tetap keluar?")
                )
                  return;
                try {
                  setDirty(false);
                  await api("/api/office/logout", send("POST"));
                  setSession(null);
                  setMessage("");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              Keluar
            </button>
          </div>
        </aside>
        <main id="office-main" className="office-main" aria-busy={dataLoading}>
          <header className="office-heading">
            <div>
              <p>MangoTek Edu</p>
              <h1>{section}</h1>
              <p className="office-section-description">
                {sectionHelp[section]}
              </p>
            </div>
            <a href="/" target="_blank" rel="noreferrer">
              Lihat portal ↗
            </a>
          </header>
          {message && (
            <p className="office-notice" role="status">
              {message}
            </p>
          )}
          {dataLoading && (
            <div className="office-loading" role="status">
              Memuat ruang kerja…
            </div>
          )}
          {section === "Ringkasan" && !dataLoading && (
            <Overview
              docs={docs}
              admin={admin}
              name={session.user.name}
              navigate={navigate}
            />
          )}
          {(section === "Konten Portal" || section === "Pengaturan") &&
            record && (
              <ContentEditor
                key={`${section}-${record.id}`}
                record={record}
                assets={assets}
                admin={admin}
                settings={section === "Pengaturan"}
                refresh={load}
                onDirtyChange={setDirty}
                onSaved={(saved) =>
                  setDocs((current) =>
                    current.map((d) => (d.id === saved.id ? saved : d)),
                  )
                }
              />
            )}
          {(section === "Berita" || section === "Produk") &&
            (record ? (
              <>
                <button
                  className="back-button"
                  onClick={() => {
                    if (
                      dirty &&
                      !window.confirm(
                        "Perubahan belum disimpan. Kembali ke daftar?",
                      )
                    )
                      return;
                    setDirty(false);
                    setSelected(null);
                    setNewArticle(false);
                    load();
                  }}
                >
                  ← Daftar {section.toLowerCase()}
                </button>
                <ContentEditor
                  key={record.id}
                  record={record}
                  assets={assets}
                  admin={admin}
                  settings={false}
                  onDirtyChange={setDirty}
                  onSaved={(saved) =>
                    setDocs((current) =>
                      current.map((d) => (d.id === saved.id ? saved : d)),
                    )
                  }
                  refresh={() => {
                    setNewArticle(false);
                    setSelected(null);
                    load();
                  }}
                />
              </>
            ) : (
              <>
                <div className="office-heading">
                  <p>
                    Draf dan {section.toLowerCase()} yang telah diterbitkan.
                  </p>
                  <button
                    className="button button-green"
                    onClick={() => setNewArticle(true)}
                  >
                    {section === "Produk" ? "Tambah produk" : "Tulis berita"}
                  </button>
                </div>
                <div className="content-list-filters">
                  <label>
                    Cari {section.toLowerCase()}
                    <input
                      type="search"
                      placeholder="Judul atau kategori…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <label>
                    Status publikasi
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Semua status</option>
                      {["draft", "review", "published"].map((s) => (
                        <option key={s} value={s}>
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="office-list">
                  {docs.filter((d) =>
                    matchesDocument(d, documentKind, search, statusFilter),
                  ).length === 0 && (
                    <div className="office-empty">
                      <OfficeIcon name={section} />
                      <h2>
                        {search || statusFilter
                          ? "Tidak ada hasil yang cocok"
                          : `Belum ada ${section.toLowerCase()}`}
                      </h2>
                      <p>
                        {search || statusFilter
                          ? "Coba kata pencarian atau status lain."
                          : "Buat draf pertama. Konten hanya tampil di portal setelah diterbitkan."}
                      </p>
                    </div>
                  )}
                  {docs
                    .filter((d) =>
                      matchesDocument(d, documentKind, search, statusFilter),
                    )
                    .map((d) => (
                      <button
                        className="list-row"
                        key={d.id}
                        onClick={() => setSelected(d.id)}
                      >
                        <span>
                          <strong>{(d.draft as Article).title}</strong>
                          <small>{(d.draft as Article).category}</small>
                        </span>
                        <StatusBadge status={d.status} />
                      </button>
                    ))}
                </div>
              </>
            ))}
          {section === "Media" && (
            <>
              <p>
                Unggah JPEG, PNG, atau WebP, maksimal 5 MB. Gambar akan
                dioptimalkan untuk portal.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  setBusy(true);
                  try {
                    await api("/api/office/media", {
                      method: "POST",
                      body: new FormData(f),
                    });
                    f.reset();
                    load();
                    setMessage("Gambar berhasil diunggah.");
                  } catch (e) {
                    setMessage((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Gambar
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                  />
                </label>
                <button className="button button-green" disabled={busy}>
                  {busy ? "Mengunggah…" : "Unggah gambar"}
                </button>
              </form>
              <div className="media-library">
                {assets.map((a) => (
                  <figure key={a.id}>
                    <img src={a.url} alt={a.name} />
                    <figcaption>{a.name}</figcaption>
                    {admin && (
                      <button
                        onClick={async () => {
                          if (!confirm("Hapus gambar ini?")) return;
                          try {
                            await api(
                              `/api/office/media/${a.id}`,
                              send("DELETE"),
                            );
                            load();
                          } catch (e) {
                            setMessage((e as Error).message);
                          }
                        }}
                      >
                        Hapus
                      </button>
                    )}
                  </figure>
                ))}
              </div>
            </>
          )}
          {(section === "Konsultasi" || section === "Laporan") && (
            <Inquiries
              key={section}
              report={section === "Laporan"}
              onError={setMessage}
            />
          )}
          {section === "Pengguna" && <Users onError={setMessage} />}
        </main>
      </div>
    </MediaProvider>
  );
}
