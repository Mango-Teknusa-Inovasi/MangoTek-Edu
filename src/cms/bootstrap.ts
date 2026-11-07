import type { Article, Product, PortalContent } from "./schema";
export type PublishedArticle = Article & {
  id: string;
  publishedAt: string;
  modifiedAt?: string;
};
export type PublishedProduct = Product & {
  id: string;
  publishedAt: string;
  modifiedAt?: string;
};
export interface NewsPage {
  items: PublishedArticle[];
  total: number;
  page: number;
  categories: string[];
}
export type PublicPage =
  | { kind: "home"; news: PublishedArticle[]; products: PublishedProduct[] }
  | { kind: "news-list"; result: NewsPage }
  | { kind: "news-detail"; result: PublishedArticle }
  | { kind: "product-list"; result: { items: PublishedProduct[] } }
  | { kind: "product-detail"; result: PublishedProduct }
  | { kind: "not-found" };
export interface PageBootstrap {
  version: 1;
  path: string;
  portal: PortalContent;
  page: PublicPage;
}
let cached: PageBootstrap | undefined;
export function getBootstrap(): PageBootstrap | undefined {
  if (cached) return cached;
  if (typeof document === "undefined") return;
  const script = document.getElementById("portal-bootstrap");
  if (!script) return;
  try {
    const data = JSON.parse(script.textContent || "");
    if (
      data.version === 1 &&
      data.path === location.pathname + location.search &&
      data.portal?.identity &&
      data.page?.kind
    )
      cached = data;
  } catch {}
  return cached;
}
export function setBootstrap(value: PageBootstrap) {
  cached = value;
}
