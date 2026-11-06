import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { uploadImage } from "./client";
export interface MediaAsset {
  id: string;
  url: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  created_at?: string;
}
const MediaContext = createContext<{
  assets: MediaAsset[];
  add: (asset: MediaAsset) => void;
  pending: number;
  begin: () => () => void;
}>({ assets: [], add: () => {}, pending: 0, begin: () => () => {} });
export const useMediaPending = () => useContext(MediaContext).pending > 0;
export function MediaProvider({
  assets,
  add,
  children,
}: {
  assets: MediaAsset[];
  add: (asset: MediaAsset) => void;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(0);
  const begin = useCallback(() => {
    let done = false;
    setPending((n) => n + 1);
    return () => {
      if (!done) {
        done = true;
        setPending((n) => n - 1);
      }
    };
  }, []);
  return (
    <MediaContext.Provider value={{ assets, add, pending, begin }}>
      {children}
    </MediaContext.Provider>
  );
}
const builtins: MediaAsset[] = [
  {
    id: "edu",
    url: "/brand/mangotek-edu.svg",
    name: "Logo MangoTek Edu",
    size: 0,
  },
  {
    id: "edu-light",
    url: "/brand/mangotek-edu-light.svg",
    name: "Logo MangoTek Edu terang",
    size: 0,
  },
  {
    id: "parent",
    url: "/mango-wordmark.png",
    name: "Logo Mango Teknusa Inovasi",
    size: 0,
  },
  {
    id: "social",
    url: "/social-card.png",
    name: "Gambar sosial MangoTek Edu",
    size: 0,
  },
];
const formats = ["image/png", "image/jpeg", "image/webp"];
export function MediaField({
  caption,
  value,
  onChange,
  disabled = false,
}: {
  caption: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const { assets, add, begin } = useContext(MediaContext);
  const id = useId(),
    input = useRef<HTMLInputElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(true),
    trigger = useRef<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false),
    [percent, setPercent] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [dragging, setDragging] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  const choose = (url: string) => {
    onChange(url);
    setError("");
    setNotice("Gambar dipilih. Simpan draf untuk menyimpan perubahan.");
    closeLibrary();
  };
  const closeLibrary = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  const upload = async (file?: File) => {
    if (!file || disabled || controller.current) return;
    setError("");
    setNotice("");
    if (
      (file.type && !formats.includes(file.type)) ||
      !/\.(png|jpe?g|webp)$/i.test(file.name)
    ) {
      setError("Gunakan PNG, JPEG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024 || !file.size) {
      setError("Pilih gambar berukuran maksimal 5 MB.");
      return;
    }
    const finish = begin();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setPercent(0);
    try {
      const asset = await uploadImage(file, {
        signal: abort.signal,
        onProgress: setPercent,
      });
      if (!mounted.current) return;
      add(asset);
      onChange(asset.url);
      setNotice(
        "Gambar berhasil diunggah dan dipilih. Simpan draf untuk menyimpan perubahan.",
      );
    } catch (reason) {
      if (mounted.current) {
        if ((reason as Error).name === "AbortError")
          setNotice(
            "Unggahan dibatalkan. Pilihan gambar sebelumnya dipertahankan.",
          );
        else setError((reason as Error).message);
      }
    } finally {
      finish();
      controller.current = null;
      if (mounted.current) {
        setBusy(false);
        if (input.current) input.current.value = "";
      }
    }
  };
  const name =
    assets.find((a) => a.url === value)?.name ||
    builtins.find((a) => a.url === value)?.name ||
    "Gambar terpilih";
  const choices = [
    ...assets,
    ...builtins.filter((b) => !assets.some((a) => a.url === b.url)),
  ].filter((a) =>
    a.name.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")),
  );
  return (
    <div className="media-field" role="group" aria-labelledby={`${id}-label`}>
      <span className="media-field-label" id={`${id}-label`}>
        {caption}
      </span>
      <div
        className={`media-dropzone ${dragging ? "is-dragging" : ""} ${value ? "has-image" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy && !disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) upload(event.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <div className="media-current">
            <div className="media-thumbnail">
              <img
                src={value}
                alt={`Pratinjau ${caption.toLocaleLowerCase("id")}`}
              />
            </div>
            <div>
              <strong>{name}</strong>
              <small>
                Gambar terpilih untuk {caption.toLocaleLowerCase("id")}
              </small>
            </div>
          </div>
        ) : (
          <div className="media-placeholder">
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4h16v16H4zM4 16l5-5 5 5 3-3 3 3M12 4v6m-3-3 3-3 3 3" />
            </svg>
            <strong>Unggah gambar atau seret ke sini</strong>
            <span>PNG, JPEG, WebP · maksimal 5 MB</span>
          </div>
        )}
        <div className="media-field-actions">
          <input
            ref={input}
            id={`${id}-file`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label={`Unggah ${caption.toLocaleLowerCase("id")}`}
            className="media-file-input"
            disabled={busy || disabled}
            onChange={(event) => upload(event.target.files?.[0])}
          />
          <button
            type="button"
            className="media-upload-button"
            disabled={busy || disabled}
            onClick={() => input.current?.click()}
          >
            {value ? "Ganti gambar" : "Unggah gambar"}
          </button>
          <button
            type="button"
            disabled={busy || disabled}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setSearch("");
              dialog.current?.showModal();
              dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
            }}
          >
            Pilih dari pustaka
          </button>
        </div>
        {busy && (
          <div className="media-upload-progress" role="status">
            <label htmlFor={`${id}-progress`}>
              {percent === 100
                ? "Memproses dan menyimpan gambar…"
                : `Mengunggah ${percent}%`}
            </label>
            <progress id={`${id}-progress`} max="100" value={percent} />
            <button type="button" onClick={() => controller.current?.abort()}>
              Batalkan unggah
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error} Pilih kembali berkas untuk mencoba lagi.
        </p>
      )}
      <p className="media-feedback" role="status">
        {notice}
      </p>
      <dialog
        ref={dialog}
        className="media-picker"
        aria-labelledby={`${id}-picker-title`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeLibrary();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          closeLibrary();
        }}
      >
        <div className="media-picker-heading">
          <div>
            <h2 id={`${id}-picker-title`}>Pilih gambar</h2>
            <p>Pilih gambar untuk {caption.toLocaleLowerCase("id")}.</p>
          </div>
          <button type="button" onClick={closeLibrary}>
            Tutup pustaka
          </button>
        </div>
        <label>
          Cari gambar
          <input
            type="search"
            autoFocus
            placeholder="Nama berkas…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="media-picker-grid">
          {choices.map((asset) => (
            <button
              type="button"
              key={asset.id}
              aria-label={`Pilih ${asset.name}`}
              aria-pressed={asset.url === value}
              onClick={() => choose(asset.url)}
            >
              <div>
                <img src={asset.url} alt="" loading="lazy" />
              </div>
              <strong>{asset.name}</strong>
              {asset.width && asset.height ? (
                <small>
                  {asset.width} × {asset.height} px
                </small>
              ) : null}
              {asset.url === value && <span>Terpilih</span>}
            </button>
          ))}
        </div>
        {!choices.length && (
          <p className="office-empty">
            Tidak ada gambar yang cocok. Coba nama lain atau unggah gambar baru.
          </p>
        )}
      </dialog>
    </div>
  );
}
