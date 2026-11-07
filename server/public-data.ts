import type { NewsPage, PublishedArticle } from "../src/cms/bootstrap";
export function selectNews(
  all: PublishedArticle[],
  query: Record<string, string>,
): NewsPage {
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(query.page) || 1)),
  );
  const q = (query.q || "").slice(0, 200).toLocaleLowerCase("id");
  const filtered = all.filter(
    (a) =>
      (!query.category || a.category === query.category) &&
      (!q || `${a.title} ${a.summary}`.toLocaleLowerCase("id").includes(q)),
  );
  return {
    items: filtered.slice((page - 1) * 9, page * 9),
    total: filtered.length,
    page,
    categories: [...new Set(all.map((a) => a.category))],
  };
}
