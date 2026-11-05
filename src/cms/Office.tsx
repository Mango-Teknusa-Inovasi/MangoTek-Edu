import { useEffect, useState, type FormEvent } from "react";
import { api, send } from "./client";
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
    caption = labels[key] || key;
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
        {value.map((v, i) => (
          <div className="editor-item" key={i}>
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
                onChange(value.map((x: any, j: number) => (j === i ? n : x)))
              }
              path={`${path}.${i}`}
              assets={assets}
            />
          </div>
        ))}
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
            onChange={(n) => onChange({ ...value, [k]: n })}
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
      <label>
        {caption}
        <select
          aria-label={caption}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Pilih gambar</option>
          {[
            ...new Set([
              value,
              ...(key === "logo"
                ? ["/brand/mangotek-edu.svg", "/brand/mangotek-edu-light.svg"]
                : key === "parentLogo"
                  ? ["/mango-wordmark.png"]
                  : []),
              ...assets.map((a) => a.url),
            ]),
          ]
            .filter(Boolean)
            .map((url) => (
              <option key={url} value={url}>
                {assets.find((a) => a.url === url)?.name || url}
              </option>
            ))}
        </select>
        {value && (
          <img
            className="asset-preview"
            src={value}
            alt="Pratinjau gambar terpilih"
          />
        )}
      </label>
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
}: {
  record: DocumentRecord;
  admin: boolean;
  settings: boolean;
  refresh: () => void;
  assets: any[];
}) {
  const [draft, setDraft] = useState<any>(record.draft),
    [revision, setRevision] = useState(record.revision),
    [status, setStatus] = useState(record.status),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
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
    setMessage("");
    setBusy(true);
    try {
      if (isNew) {
        await api("/api/office/documents", send("POST", { ...draft, kind: record.kind }));
        refresh();
      } else {
        const next = await api(
          `/api/office/documents/${record.id}`,
          send("PUT", { revision, content: draft }),
        );
        setRevision(next.revision);
        setStatus(next.status);
        setDirty(false);
        setMessage("Draf tersimpan.");
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const action = async (action: string) => {
    setBusy(true);
    setMessage("");
    try {
      const r = await api(
        `/api/office/documents/${record.id}/${action}`,
        send("POST", { revision }),
      );
      setRevision(r.revision);
      setStatus(r.status);
      setMessage(
        action === "publish"
          ? "Konten telah diterbitkan."
          : action === "review"
            ? "Draf diajukan untuk ditinjau."
            : "Berita ditarik dari publikasi.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const fields = Object.keys(draft).filter((k) =>
    article || settings
      ? article || ["identity", "theme", "navigation", "seo"].includes(k)
      : !["identity", "theme", "navigation", "seo"].includes(k),
  );
  return (
    <div>
      <div className="editor-status">
        <span>
          {statusLabels[status]} · Versi {revision}
        </span>
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
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <fieldset disabled={busy} className="editor-fields">
          {fields.map((k) => (
            <details
              className="editor-section"
              key={k}
              open={article || undefined}
            >
              <summary>{labels[k] || k}</summary>
              <Field
                path={k}
                value={draft[k]}
                onChange={(value) => {
                  setDraft({ ...draft, [k]: value });
                  setDirty(true);
                }}
                assets={assets}
              />
            </details>
          ))}
        </fieldset>
        <div className="editor-actions">
          <button className="button button-green" disabled={busy}>
            Simpan draf
          </button>
          {!isNew && (
            <>
              <button
                type="button"
                disabled={busy || dirty}
                onClick={() => action("review")}
              >
                Ajukan tinjauan
              </button>
              {admin && (
                <button
                  type="button"
                  disabled={busy || dirty}
                  onClick={() => action("publish")}
                >
                  Terbitkan
                </button>
              )}
              {admin && article && record.published && (
                <button
                  type="button"
                  disabled={busy || dirty}
                  onClick={() => action("unpublish")}
                >
                  Tarik publikasi
                </button>
              )}
            </>
          )}
          {dirty && <span>Belum disimpan</span>}
        </div>
      </form>
      {message && (
        <p className="office-notice" role="status">
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
  title: "Produk baru", slug: "produk-baru", summary: "", category: "Produk pendidikan",
  cover: "", coverAlt: "", blocks: [{ type: "paragraph", text: "" }], screenshots: [],
  videoUrl: "", videoTranscript: "", websiteUrl: "", seoTitle: "", seoDescription: "",
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
  const load = () =>
    api(`/api/office/inquiries?${query}`)
      .then(setRows)
      .catch((e) => onError(e.message));
  useEffect(() => {
    load();
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
              <span>{statusLabels[r.status]}</span>
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
export default function Office() {
  const [session, setSession] = useState<{ user: User } | null>(null),
    [loading, setLoading] = useState(true),
    [section, setSection] = useState("Konten Portal"),
    [message, setMessage] = useState(""),
    [docs, setDocs] = useState<DocumentRecord[]>([]),
    [assets, setAssets] = useState<any[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [newArticle, setNewArticle] = useState(false),
    [busy, setBusy] = useState(false);
  const load = () =>
    Promise.all([api("/api/office/documents"), api("/api/office/media")])
      .then(([d, m]) => {
        setDocs(d);
        setAssets(m);
      })
      .catch((e) => setMessage(e.message));
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
        "Konten Portal",
        "Berita",
        "Produk",
        "Media",
        "Konsultasi",
        "Laporan",
        "Pengguna",
        "Pengaturan",
      ]
    : ["Konten Portal", "Berita", "Produk", "Media"];
  const documentKind = section === "Produk" ? "product" : "article";
  const record =
    (section === "Berita" || section === "Produk")
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
    <div className="office-shell">
      <a className="skip-link" href="#office-main">
        Langsung ke konten office
      </a>
      <aside className="office-sidebar">
        <a href="/">
          <img src="/brand/mangotek-edu.svg" alt="MangoTek Edu" />
        </a>
        <span className="office-label">OFFICE</span>
        <nav aria-label="Menu office">
          {menu.map((s) => (
            <button
              key={s}
              aria-current={section === s ? "page" : undefined}
              onClick={() => {
                setSection(s);
                setSelected(null);
                setNewArticle(false);
                setMessage("");
                load();
              }}
            >
              {s}
            </button>
          ))}
        </nav>
        <div className="office-account">
          <strong>{session.user.name}</strong>
          <span>{admin ? "Admin" : "Editor"}</span>
          <button
            onClick={async () => {
              try {
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
      <main id="office-main" className="office-main">
        <header className="office-heading">
          <div>
            <p>MangoTek Edu</p>
            <h1>{section}</h1>
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
        {(section === "Konten Portal" || section === "Pengaturan") &&
          record && (
            <ContentEditor
              key={`${section}-${record.revision}`}
              record={record}
              assets={assets}
              admin={admin}
              settings={section === "Pengaturan"}
              refresh={load}
            />
          )}
        {(section === "Berita" || section === "Produk") &&
          (record ? (
            <>
              <button
                className="back-button"
                onClick={() => {
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
                <p>Draf dan {section.toLowerCase()} yang telah diterbitkan.</p>
                <button
                  className="button button-green"
                  onClick={() => setNewArticle(true)}
                >
                  {section === "Produk" ? "Tambah produk" : "Tulis berita"}
                </button>
              </div>
              <div className="office-list">
                {docs.filter((d) => d.kind === documentKind).length === 0 && (
                  <p>Belum ada {section.toLowerCase()}. Mulai dengan membuat draf pertama.</p>
                )}
                {docs
                  .filter((d) => d.kind === documentKind)
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
                      <span>{statusLabels[d.status]}</span>
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
                Unggah gambar
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
  );
}
