import { useEffect, useState } from "react";
import { api } from "./client";
import { usePortal } from "./PortalContext";
import type { Article } from "./schema";
export type NewsItem = Article & { id: string; publishedAt: string };
export function NewsCards({ items }: { items: NewsItem[] }) {
  return (
    <div className="news-grid">
      {items.map((a) => (
        <article key={a.id}>
          {a.cover && <img src={a.cover} alt={a.coverAlt} loading="lazy" />}
          <p className="news-category">{a.category}</p>
          <h3>
            <a href={`/berita/${a.slug}`}>{a.title}</a>
          </h3>
          <p>{a.summary}</p>
          <time dateTime={a.publishedAt}>
            {new Date(a.publishedAt).toLocaleDateString("id-ID", {
              dateStyle: "long",
              timeZone: "Asia/Jakarta",
            })}
          </time>
        </article>
      ))}
    </div>
  );
}
export function LatestNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  useEffect(() => {
    api("/api/news")
      .then((r) => setItems(r.items.slice(0, 3)))
      .catch(() => {});
  }, []);
  return items.length ? (
    <section id="berita" className="section-space">
      <div className="container">
        <div className="section-heading">
          <h2>Kabar dari MangoTek Edu</h2>
          <a href="/berita" className="inline-link">
            Semua berita →
          </a>
        </div>
        <NewsCards items={items} />
      </div>
    </section>
  ) : null;
}
export function ArticleView({ article }: { article: Article & { publishedAt?: string } }) {
  return (
    <article className="news-article">
      <p className="news-category">{article.category}</p>
      <h1>{article.title}</h1>
      {article.publishedAt && <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}</time>}
      <p className="news-lead">{article.summary}</p>
      {article.cover && <img src={article.cover} alt={article.coverAlt} />}
      <div className="article-body">
        {article.blocks.map((b, i) =>
          b.type === "heading" ? (
            <h2 key={i}>{b.text}</h2>
          ) : b.type === "quote" ? (
            <blockquote key={i}>{b.text}</blockquote>
          ) : (
            <p key={i}>{b.text}</p>
          ),
        )}
      </div>
    </article>
  );
}
export default function News() {
  const portal = usePortal();
  const slug = location.pathname.split("/")[2];
  const params = new URLSearchParams(location.search);
  const [result, setResult] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api(slug ? `/api/news/${encodeURIComponent(slug)}` : `/api/news?${params}`)
      .then(setResult)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/">
            <img src={portal.identity.logo} alt={portal.identity.name} />
          </a>
          <a href="/">Kembali ke beranda</a>
        </div>
      </header>
      <main className="container news-page">
        <a className="inline-link" href={slug ? "/berita" : "/"}>
          {slug ? "← Semua berita" : "← Beranda"}
        </a>
        {error ? (
          <h1>{error}</h1>
        ) : !result ? (
          <p role="status">Memuat berita…</p>
        ) : slug ? (
          <ArticleView article={result} />
        ) : (
          <>
            <h1>Kabar dan kegiatan</h1>
            <p>Berita terbaru dari MangoTek Edu.</p>
            <form className="news-filters" action="/berita">
              <label>
                Cari berita
                <input name="q" defaultValue={params.get("q") || ""} />
              </label>
              <label>
                Kategori
                <select
                  name="category"
                  defaultValue={params.get("category") || ""}
                >
                  <option value="">Semua kategori</option>
                  {result.categories.map((s: string) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button className="button button-green">Cari</button>
            </form>
            {result.items.length ? (
              <NewsCards items={result.items} />
            ) : (
              <p>Belum ada berita yang dapat ditampilkan.</p>
            )}
            <nav className="pagination" aria-label="Halaman berita">
              {Array.from({ length: Math.ceil(result.total / 9) }, (_, i) => (
                <a
                  key={i}
                  aria-current={result.page === i + 1 ? "page" : undefined}
                  href={`?${new URLSearchParams({ q: params.get("q") || "", category: params.get("category") || "", page: String(i + 1) })}`}
                >
                  {i + 1}
                </a>
              ))}
            </nav>
          </>
        )}
      </main>
      <footer className="container news-footer">
        © {new Date().getFullYear()} {portal.identity.name} · Part of{" "}
        {portal.identity.parentName}
        <p>{portal.seo.region}, {portal.seo.country} · <a href={`mailto:${portal.seo.contactEmail}`}>{portal.seo.contactEmail}</a></p>
      </footer>
    </>
  );
}
