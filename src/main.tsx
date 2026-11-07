import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles.css";
import "./cms/cms.css";
import "./components/loading/loading.css";
import { api, ApiError } from "./cms/client";
import { PortalProvider } from "./cms/PortalContext";
import {
  getBootstrap,
  setBootstrap,
  type PageBootstrap,
} from "./cms/bootstrap";
import { Loading, LoadError } from "./components/loading/Loading";
import type { DocumentRecord, PortalContent } from "./cms/schema";
import type { User } from "./cms/Office";
const root = document.getElementById("root")!;
const path = location.pathname,
  office = path === "/office",
  previewId = path.startsWith("/office/preview/")
    ? path.split("/").pop()
    : null;
const existing = getBootstrap();
let pendingRoot: ReturnType<typeof ReactDOM.createRoot> | undefined;
const moduleRequest = office
  ? import("./cms/Office")
  : previewId
    ? Promise.all([
        import("./App"),
        import("./cms/News"),
        import("./cms/Products"),
      ])
    : path.startsWith("/produk")
      ? import("./cms/Products")
      : path.startsWith("/berita")
        ? import("./cms/News")
        : import("./App");
moduleRequest.catch(() => {});
class BootBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <LoadError
        full
        message="Halaman belum dapat ditampilkan. Periksa koneksi Anda dan coba lagi."
        onRetry={() => location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}
function fail(error: Error) {
  const host = root.querySelector(".server-content")
    ? document.createElement("div")
    : root;
  if (host !== root) {
    host.className = "boot-error";
    root.prepend(host);
  }
  (host === root
    ? (pendingRoot ||= ReactDOM.createRoot(root))
    : ReactDOM.createRoot(host)
  ).render(
    <LoadError
      full={host === root}
      message={
        error instanceof ApiError
          ? error.message
          : "Halaman belum dapat diunduh. Periksa koneksi Anda dan coba lagi."
      }
      onRetry={() => location.reload()}
    />,
  );
}
async function fallback(): Promise<PageBootstrap> {
  const portal = api<PortalContent>("/api/portal");
  const slug = path.split("/")[2];
  const data = path.startsWith("/berita")
    ? api(
        slug
          ? `/api/news/${encodeURIComponent(slug)}`
          : `/api/news${location.search}`,
      )
    : path.startsWith("/produk")
      ? api(
          slug ? `/api/products/${encodeURIComponent(slug)}` : "/api/products",
        )
      : Promise.all([api("/api/news"), api("/api/products")]);
  const [p, result] = await Promise.all([portal, data]);
  const page: PageBootstrap["page"] = path.startsWith("/berita")
    ? slug
      ? { kind: "news-detail", result }
      : { kind: "news-list", result }
    : path.startsWith("/produk")
      ? slug
        ? { kind: "product-detail", result }
        : { kind: "product-list", result }
      : {
          kind: "home",
          news: result[0].items.slice(0, 3),
          products: p.showcase.visible ? result[1].items.slice(0, 3) : [],
        };
  return { version: 1, path: path + location.search, portal: p, page };
}
if (office) {
  const sessionRequest = api<{ user: User }>("/api/office/session");
  sessionRequest.catch(() => {});
  const Office = lazy(
    () => moduleRequest as Promise<typeof import("./cms/Office")>,
  );
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BootBoundary>
        <Suspense fallback={<Loading full label="Menyiapkan ruang kerja…" />}>
          <Office sessionRequest={sessionRequest} />
        </Suspense>
      </BootBoundary>
    </React.StrictMode>,
  );
} else if (existing?.page.kind === "not-found") {
  document.documentElement.dataset.appReady = "true";
} else {
  if (!root.querySelector(".server-content")) {
    pendingRoot = ReactDOM.createRoot(root);
    pendingRoot.render(<Loading full />);
  }
  const dataRequest = previewId
    ? Promise.all([
        api<PortalContent>("/api/portal"),
        api<DocumentRecord[]>("/api/office/documents"),
      ])
    : Promise.resolve(existing || fallback());
  Promise.all([moduleRequest, dataRequest])
    .then(([module, data]) => {
      let content: React.ReactNode, portal: PortalContent;
      if (previewId) {
        const [p, docs] = data as [PortalContent, DocumentRecord[]],
          record = docs.find((d) => d.id === previewId);
        if (!record) throw new ApiError("Konten tidak ditemukan.", 404);
        const [app, news, products] = module as [
          typeof import("./App"),
          typeof import("./cms/News"),
          typeof import("./cms/Products"),
        ];
        portal = record.kind === "portal" ? (record.draft as PortalContent) : p;
        content = (
          <>
            <div className="preview-banner">
              Pratinjau draf — belum diterbitkan.{" "}
              <a href="/office">Kembali ke office</a>
            </div>
            {record.kind === "portal" ? (
              <app.default />
            ) : (
              <main className="container news-page">
                {record.kind === "product" ? (
                  <products.ProductView product={record.draft as any} />
                ) : (
                  <news.ArticleView article={record.draft as any} />
                )}
              </main>
            )}
          </>
        );
      } else {
        const boot = data as PageBootstrap;
        setBootstrap(boot);
        portal = boot.portal;
        const Component = (module as { default: React.ComponentType }).default;
        content = <Component />;
      }
      // Preserve server HTML until both the route module and its initial data are usable.
      (pendingRoot || ReactDOM.createRoot(root)).render(
        <React.StrictMode>
          <BootBoundary>
            <PortalProvider content={portal}>{content}</PortalProvider>
          </BootBoundary>
        </React.StrictMode>,
      );
      document.documentElement.dataset.appReady = "true";
    })
    .catch(fail);
}
