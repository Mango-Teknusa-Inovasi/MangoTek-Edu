import { useEffect, useState } from "react";
export function useSlowLoading(active = true) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(timer);
  }, [active]);
  return slow;
}
export function Loading({
  label = "Menyiapkan halaman…",
  full = false,
  inline = false,
}: {
  label?: string;
  full?: boolean;
  inline?: boolean;
}) {
  const slow = useSlowLoading();
  return (
    <div
      className={`mango-loading ${full ? "is-full" : inline ? "is-inline" : "is-section"}`}
      role="status"
      aria-live="polite"
    >
      <div className="mango-loading-inner">
        <span className="mango-loading-mark" aria-hidden="true">
          <img src="/favicon.svg" alt="" width="56" height="56" />
        </span>
        <span className="mango-loading-label">{label}</span>
        {slow && (
          <span className="loading-slow">
            Memuat lebih lama dari biasanya. Kami masih menunggu respons server.
          </span>
        )}
      </div>
    </div>
  );
}
export type SkeletonKind =
  | "cards"
  | "article"
  | "overview"
  | "editor"
  | "list"
  | "report"
  | "users"
  | "media";
export function Skeleton({
  kind = "list",
  label = "Menyiapkan konten…",
}: {
  kind?: SkeletonKind;
  label?: string;
}) {
  const slow = useSlowLoading();
  return (
    <section
      className={`skeleton-region skeleton-${kind}`}
      aria-busy="true"
      aria-label={label}
    >
      <span role="status" className="sr-only">
        {label}
      </span>
      <div aria-hidden="true" className="skeleton-shapes">
        {kind === "cards" || kind === "media" ? (
          Array.from({ length: kind === "media" ? 6 : 3 }, (_, i) => (
            <div className="skeleton-card" key={i}>
              <span className="skeleton-block skeleton-picture" />
              <span className="skeleton-block skeleton-line" />
              <span className="skeleton-block skeleton-line short" />
            </div>
          ))
        ) : kind === "article" ? (
          <>
            <span className="skeleton-block skeleton-title" />
            <span className="skeleton-block skeleton-line" />
            <span className="skeleton-block skeleton-picture" />
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="skeleton-block skeleton-line" />
            ))}
          </>
        ) : kind === "overview" || kind === "report" ? (
          <>
            <span className="skeleton-block skeleton-banner" />
            <div className="skeleton-metrics">
              {[0, 1, 2].map((i) => (
                <span key={i} className="skeleton-block" />
              ))}
            </div>
            {[0, 1, 2].map((i) => (
              <span key={i} className="skeleton-block skeleton-row" />
            ))}
          </>
        ) : kind === "editor" ? (
          <div className="skeleton-editor-layout">
            <div className="skeleton-rail">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="skeleton-block skeleton-row" />
              ))}
            </div>
            <div className="skeleton-form">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <span className="skeleton-block skeleton-line short" />
                  <span className="skeleton-block skeleton-input" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          Array.from({ length: 5 }, (_, i) => (
            <div className="skeleton-row" key={i}>
              <span className="skeleton-block skeleton-line" />
              <span className="skeleton-block skeleton-line short" />
            </div>
          ))
        )}
      </div>
      {slow && (
        <p className="loading-slow" role="status">
          Memuat lebih lama dari biasanya. Kami masih menunggu respons server.
        </p>
      )}
    </section>
  );
}
export function LoadError({
  message,
  onRetry,
  full = false,
}: {
  message: string;
  onRetry: () => void;
  full?: boolean;
}) {
  return (
    <div className={`load-error ${full ? "is-full" : ""}`}>
      <div>
        <img src="/favicon.svg" alt="" width="48" height="48" />
        <h2>Halaman belum dapat dimuat</h2>
        <p role="alert">{message}</p>
        <button type="button" className="button button-green" onClick={onRetry}>
          Coba lagi
        </button>
      </div>
    </div>
  );
}
