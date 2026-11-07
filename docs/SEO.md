# Search, Social Sharing, and Machine-Readable Content

## Public identity

The initial SEO settings use MangoTek Edu, part of Mango Teknusa Inovasi, with `billing@ppti.me` as the public marketing contact. The supplied region is represented as East Java, Indonesia (`ID-JI`). No street address, coordinates, customer count, ratings, or certifications are invented.

Administrators can edit the title, description, social image, image alternative text, email, and region in **Office → Pengaturan → SEO, kontak, dan wilayah**. Changes follow the existing draft/review/publication workflow. Older portal records receive these defaults when read; no destructive database migration is needed.

`APP_ORIGIN` is the canonical site origin. Set it to `https://ppti.me` for production, without a trailing slash or path. Configure reverse proxy HTTPS and trusted proxy hops separately. Do not use a private host IP as the production origin.

## Implemented endpoints

| Endpoint | Purpose |
| --- | --- |
| `/` | Server-readable published introduction, services, approach, FAQ, contact, and available portfolio/news content |
| `/berita` and `/berita/:slug` | Published news, pagination, per-article metadata and structured data |
| `/produk` and `/produk/:slug` | Published products and portfolio detail pages |
| `/sitemap.xml` | Canonical public pages, news pagination, published news/products, and cover images |
| `/robots.txt` | Public crawling allowed; office, API, and health paths excluded |
| `/llms.txt` | A concise description and links to published machine-readable content |
| `/llms-full.txt` | Combined published portal, product, and news text |
| `/index.md` | Markdown representation of the published portal |
| `/berita/:slug.md` and `/produk/:slug.md` | Markdown representations of published detail pages |
| `/social-card.png` | Default 1200 × 630 social preview image |

The server sends the same public HTML to users and crawlers. JavaScript adds the interactive portal; meaningful public content remains readable with JavaScript disabled. This is not user-agent cloaking. Only published snapshots are used in crawlable output. Drafts, consultation records, sessions, and office content are never included.

Pages include canonical links, descriptions, Open Graph, Twitter card metadata, language, social image alternative text, and JSON-LD. Home structured data describes the organization, website, services, and visible FAQs. Detail pages describe articles or portfolio creative works, with breadcrumbs. Product pages do not invent offers, prices, reviews, or product ratings. Search/category-filtered news pages use `noindex, follow`; unfiltered pagination has its own canonical URL. Missing pages return 404.

Office and API responses include `X-Robots-Tag: noindex, nofollow`. Robots rules are crawler instructions, not authorization. Office authentication and authorization remain enforced separately.

Article/product modification dates come from publication snapshots, not later draft edits. Sitemap dates are omitted where there is no reliable combined modification time. Publication and withdrawal are reflected on the next request; no manual sitemap regeneration is needed.

## Social image

The initial image uses the existing Edu logo, school diorama, Plus Jakarta Sans, ivory background, forest green type, and mango accent. Its source is `scripts/social-card.mjs`.

```sh
npm run social:build
```

This command uses local Google Chrome, or Playwright Chromium when `CI=true`, and does not require external image services. Regenerate the card if the brand or printed domain changes. News and products use their own cover image when supplied, with the portal image as a fallback.

## Products and trust section

Editors and admins manage products under **Office → Produk**. Products use the same review, conflict detection, preview, and publication flow as news. Slugs are unique across document records. A product contains a cover, alternative text, description blocks, ordered screenshots, optional website URL, and optional direct HTTPS MP4/WebM video URL. Upload screenshots through **Media** first. Video hosting is external in this version; there is no video upload/transcoding service or arbitrary iframe embed.

Videos use native controls, no autoplay, and `preload="none"`. Add a complete transcript/description and include captions in the hosted video when it contains speech. Use a stable media URL that serves a browser-compatible codec, with the correct MIME type and range-request support. The application never downloads the supplied video on the server.

The homepage displays up to three published products when enabled. It hides the section when no product is published. **Konten Portal → Portofolio dan organisasi yang mempercayai kami** controls the heading, visibility, and customer/partner logos. The trust list starts empty and remains hidden until real entries are entered. Publish only names and logos with permission to make the displayed relationship claim.

## After deployment

1. Build and deploy an image containing these changes. The previously released `0.1.0` image does not acquire local code changes automatically.
2. Verify HTTPS, the configured origin, and 200 responses for `/`, `/robots.txt`, `/sitemap.xml`, and `/social-card.png` through the public proxy.
3. Verify ownership of `ppti.me` in Google Search Console, preferably with the DNS TXT record supplied by Google.
4. Submit `https://ppti.me/sitemap.xml` and inspect the homepage plus a real published news/product page. Request indexing for those URLs when appropriate.
5. Validate structured data with Google's Rich Results Test and Schema.org's validator. FAQ markup is not a promise of a Google FAQ rich result; eligibility is restricted.
6. Check the social preview after deployment. Social platforms may cache an older preview until their refresh/debug tools are used.
7. Monitor indexing, crawl errors, performance, and search queries. Publish accurate, useful work samples and maintain the contact information.

No Search Console ownership verification, sitemap submission, or live deployment is performed by these source changes. Do not add fake verification tokens, mass-generated location pages, or hidden keywords. Sitemap submission and structured data do not guarantee indexing or ranking. `llms.txt` is supplementary machine-readable content, not a ranking signal or an instruction that AI providers must follow. Google does not require a special AI text file for its AI search features.

## Verification

```sh
npm run build
npm run test:seo
DB_DRIVER=sqlite SQLITE_PATH=/tmp/mangotek-test.sqlite npm run test:api
npm test
```

SEO tests use their own temporary SQLite database. They cover public HTML, metadata, sitemap and robots rules, publication isolation, product workflow, draft conflicts, unsafe URLs, publication timestamps, legacy defaults, and social image dimensions. Browser tests cover product editing, preview privacy, responsive galleries, video controls/transcripts, accessibility, and content without JavaScript.

## References

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google: Sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [The llms.txt proposal](https://llmstxt.org/)

Public HTML includes an escaped, inert JSON bootstrap containing the published portal configuration and the published data needed by that page. The client reuses it instead of immediately fetching the same records again. As with the existing public portal API, section visibility controls rendered content; hidden fields in an already published configuration are not a confidentiality boundary. Draft revisions and office/session/inquiry data are not embedded. Public HTML revalidates, while hashed static assets use immutable cache headers and negotiated Brotli/gzip variants.
