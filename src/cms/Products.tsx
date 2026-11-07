import { useEffect, useState } from "react";
import { api } from "./client";
import { getBootstrap } from "./bootstrap";
import { Skeleton, LoadError } from "../components/loading/Loading";
import { useRead } from "./useRead";
import { usePortal } from "./PortalContext";
import type { Product } from "./schema";
export type PublicProduct = Product & { id: string; publishedAt: string };
export function ProductCards({ items }: { items: PublicProduct[] }) {
  return (
    <div className="product-grid">
      {items.map((p) => (
        <article key={p.id} className="product-card">
          <a href={`/produk/${p.slug}`}>
            <img
              src={p.cover}
              alt={p.coverAlt}
              loading="lazy"
              width="960"
              height="600"
            />
            <span className="content-label">{p.category}</span>
            <h3>{p.title}</h3>
          </a>
          <p>{p.summary}</p>
        </article>
      ))}
    </div>
  );
}
export function ProductView({ product }: { product: Product }) {
  return (
    <article className="news-article product-detail">
      <p className="news-category">{product.category}</p>
      <h1>{product.title}</h1>
      <p className="news-lead">{product.summary}</p>
      <img
        className="product-cover"
        src={product.cover}
        alt={product.coverAlt}
      />
      <div className="article-body">
        {product.blocks.map((b, i) =>
          b.type === "heading" ? (
            <h2 key={i}>{b.text}</h2>
          ) : b.type === "quote" ? (
            <blockquote key={i}>{b.text}</blockquote>
          ) : (
            <p key={i}>{b.text}</p>
          ),
        )}
      </div>
      {product.screenshots.length > 0 && (
        <section className="product-gallery">
          <h2>Tampilan produk</h2>
          {product.screenshots.map((s, i) => (
            <figure key={i}>
              <img src={s.image} alt={s.alt} loading="lazy" />
              {s.caption && <figcaption>{s.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}
      {product.videoUrl && (
        <section className="product-video">
          <h2>Video produk</h2>
          <video
            controls
            playsInline
            preload="none"
            poster={product.cover}
            src={product.videoUrl}
            aria-label={`Video ${product.title}`}
          />
          <details>
            <summary>Transkrip dan deskripsi video</summary>
            <p>{product.videoTranscript}</p>
          </details>
        </section>
      )}
      {product.websiteUrl && (
        <a
          className="button button-green"
          href={product.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Kunjungi produk ↗
        </a>
      )}
    </article>
  );
}
export function PortfolioSection() {
  const p = usePortal();
  const boot = getBootstrap(),
    initial = boot?.page.kind === "home" ? boot.page.products : undefined;
  const [items, setItems] = useState<PublicProduct[]>(initial || []);
  useEffect(() => {
    if (initial) return;
    if (p.showcase.visible)
      api("/api/products")
        .then((r) => setItems(r.items.slice(0, 3)))
        .catch(() => {});
  }, [p.showcase.visible]);
  return (
    <>
      {p.showcase.visible && items.length > 0 && (
        <section className="section-space portfolio-section" id="produk">
          <div className="container">
            <div className="section-heading">
              <div>
                <h2>{p.showcase.title}</h2>
                <p>{p.showcase.intro}</p>
              </div>
              <a className="inline-link" href="/produk">
                Semua produk dan karya →
              </a>
            </div>
            <ProductCards items={items} />
          </div>
        </section>
      )}
      {p.showcase.partners.length > 0 && (
        <section
          className="trust-section container"
          aria-labelledby="trust-title"
        >
          <h2 id="trust-title">{p.showcase.trustTitle}</h2>
          <ul>
            {p.showcase.partners.map((partner, i) => (
              <li key={i}>
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={partner.logo} alt={partner.name} loading="lazy" />
                  </a>
                ) : (
                  <img src={partner.logo} alt={partner.name} loading="lazy" />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
export default function Products() {
  const p = usePortal();
  const slug = location.pathname.split("/")[2];
  const boot = getBootstrap(),
    initial =
      boot?.page.kind === "product-list" || boot?.page.kind === "product-detail"
        ? boot.page.result
        : undefined;
  const request = useRead<{ items: PublicProduct[] } | Product>(
    initial
      ? null
      : slug
        ? `/api/products/${encodeURIComponent(slug)}`
        : "/api/products",
  );
  const result = initial || request.data,
    error = request.error;
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/">
            <img src={p.identity.logo} alt={p.identity.name} />
          </a>
          <a href="/">Kembali ke beranda</a>
        </div>
      </header>
      <main className="container news-page">
        <nav className="product-breadcrumbs" aria-label="Jejak halaman">
          <a href="/">Beranda</a>
          <span aria-hidden="true"> / </span>
          {slug ? (
            <a href="/produk">Produk &amp; Portofolio</a>
          ) : (
            <span>Produk &amp; Portofolio</span>
          )}
        </nav>
        {error ? (
          <LoadError message={error} onRetry={request.reload} />
        ) : !result ? (
          <Skeleton
            kind={slug ? "article" : "cards"}
            label="Menyiapkan produk…"
          />
        ) : "items" in result ? (
          <>
            <h1>Produk &amp; Portofolio</h1>
            <p className="news-lead">{p.showcase.intro}</p>
            {result.items.length ? (
              <ProductCards items={result.items} />
            ) : (
              <div className="product-empty">
                <h2>Portofolio sedang disiapkan</h2>
                <p>Diskusikan kebutuhan sekolah Anda bersama tim kami.</p>
                <a href={`mailto:${p.seo.contactEmail}`}>
                  {p.seo.contactEmail}
                </a>
              </div>
            )}
          </>
        ) : (
          <ProductView product={result} />
        )}
      </main>
      <footer className="container news-footer">
        <p>Part of {p.identity.parentName}</p>
        <p>
          {p.seo.region}, {p.seo.country} ·{" "}
          <a href={`mailto:${p.seo.contactEmail}`}>{p.seo.contactEmail}</a>
        </p>
      </footer>
    </>
  );
}
