import { readFile } from 'node:fs/promises';
import { portalSchema, type PortalContent, type Article, type Product } from '../src/cms/schema';
import { db } from './db';

export const siteOrigin = new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:3000').origin;
export const absolute = (path: string) => new URL(path, siteOrigin).href;
export const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]!));
export const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export const visible = (p: PortalContent, id: string) => p.sections.some(s => s.id === id && s.visible);
export async function publicContent() {
  const row = await db('documents').where({ id: 'portal' }).whereNotNull('published').first();
  if (!row) throw Error('Published portal content is unavailable');
  return portalSchema.parse(JSON.parse(row.published));
}
export async function publications(kind: 'article' | 'product') {
  const rows = await db('documents').where({ kind }).whereNotNull('published').orderBy('published_at', 'desc').orderBy('id');
  const dates = await db('versions').select('document_id').max('created_at as modified').groupBy('document_id') as { document_id: string; modified: string }[];
  return rows.map(r => ({ ...JSON.parse(r.published), id: r.id, publishedAt: r.published_at, modifiedAt: dates.find(d => d.document_id === r.id)?.modified || r.published_at })) as Published[];
}
export type Published = (Article | Product) & { id: string; publishedAt: string; modifiedAt: string };
export function org(p: PortalContent) {
  return { '@type': 'Organization', '@id': absolute('/#organization'), name: p.identity.name, url: absolute('/'), logo: absolute(p.identity.logo), email: p.seo.contactEmail,
    parentOrganization: { '@type': 'Organization', name: p.identity.parentName },
    areaServed: { '@type': 'AdministrativeArea', name: p.seo.region, identifier: p.seo.regionCode, containedInPlace: { '@type': 'Country', name: p.seo.country } },
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: p.seo.contactEmail, availableLanguage: ['Indonesian'] } };
}
export function homeGraph(p: PortalContent) {
  const graph: unknown[] = [org(p), { '@type': 'WebSite', '@id': absolute('/#website'), url: absolute('/'), name: p.identity.name, inLanguage: 'id-ID', publisher: { '@id': absolute('/#organization') } },
    { '@type': 'WebPage', '@id': absolute('/#webpage'), url: absolute('/'), name: p.seo.title, description: p.seo.description, inLanguage: 'id-ID', isPartOf: { '@id': absolute('/#website') }, about: { '@id': absolute('/#organization') } }];
  if (visible(p, 'layanan')) graph.push(...p.services.map(s => ({ '@type': 'Service', '@id': absolute('/#service-' + s.id), name: s.label, description: s.description, serviceType: s.label, url: absolute('/#layanan'), provider: { '@id': absolute('/#organization') } })));
  if (visible(p, 'faq')) graph.push({ '@type': 'FAQPage', '@id': absolute('/#faq'), mainEntity: p.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  return { '@context': 'https://schema.org', '@graph': graph };
}
export function breadcrumbs(path: string, title: string, collection?: { path: string; title: string }) {
  const items = [{ path: '/', title: 'Beranda' }, ...(collection ? [collection] : []), { path, title }];
  return { '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.title, item: absolute(x.path) })) };
}
export function cards(items: Published[], prefix: string) {
  return items.map(a => `<article>${a.cover ? `<img src="${escape(a.cover)}" alt="${escape(a.coverAlt)}" loading="lazy">` : ''}<h2><a href="/${prefix}/${escape(a.slug)}">${escape(a.title)}</a></h2><p>${escape(a.summary)}</p></article>`).join('');
}
export function articleBody(a: Article | Product) {
  return `<h1>${escape(a.title)}</h1><p>${escape(a.summary)}</p>${a.cover ? `<img src="${escape(a.cover)}" alt="${escape(a.coverAlt)}">` : ''}${a.blocks.map(b => { const tag = b.type === 'heading' ? 'h2' : b.type === 'quote' ? 'blockquote' : 'p'; return `<${tag}>${escape(b.text)}</${tag}>`; }).join('')}`;
}
export function productMedia(p: Product) {
  return `${p.screenshots.map(s => `<figure><img src="${escape(s.image)}" alt="${escape(s.alt)}" loading="lazy"><figcaption>${escape(s.caption)}</figcaption></figure>`).join('')}${p.videoUrl ? `<section><h2>Video produk</h2><video controls preload="none" poster="${escape(p.cover)}" src="${escape(p.videoUrl)}"></video><h3>Transkrip dan deskripsi video</h3><p>${escape(p.videoTranscript)}</p></section>` : ''}${p.websiteUrl ? `<a href="${escape(p.websiteUrl)}" rel="noopener noreferrer">Kunjungi produk</a>` : ''}`;
}
export function footer(p: PortalContent) {
  return `<footer><p>${escape(p.identity.name)} · Part of ${escape(p.identity.parentName)}</p><p>${escape(p.seo.region)}, ${escape(p.seo.country)} · <a href="mailto:${escape(p.seo.contactEmail)}">${escape(p.seo.contactEmail)}</a></p><a href="/produk">Produk &amp; Portofolio</a> · <a href="/berita">Berita</a></footer>`;
}
export function homeBody(p: PortalContent, articles: Published[], products: Published[]) {
  const parts: Record<string, string> = {
    tentang: `<h2>${escape(p.about.title)}</h2>${p.about.paragraphs.map(x => `<p>${escape(x)}</p>`).join('')}`,
    layanan: `<h2>${escape(p.headings.services)}</h2><p>${escape(p.headings.servicesIntro)}</p>${p.services.map(s => `<article><h3>${escape(s.label)}</h3><p>${escape(s.title)}</p><p>${escape(s.description)}</p><ul>${s.needs.map(n => `<li>${escape(n)}</li>`).join('')}</ul></article>`).join('')}<p>${escape(p.notes.services)}</p>`,
    pendekatan: `<h2>${escape(p.headings.approach)}</h2><p>${escape(p.headings.approachIntro)}</p><ol>${p.steps.map(s => `<li><h3>${escape(s.title)}</h3><p>${escape(s.text)}</p></li>`).join('')}</ol><p>${escape(p.notes.approach)}</p>`,
    faq: `<h2>${escape(p.headings.faq)}</h2>${p.faqs.map(f => `<details open><summary>${escape(f.q)}</summary><p>${escape(f.a)}</p></details>`).join('')}`,
    berita: articles.length ? `<h2>Kabar dari ${escape(p.identity.name)}</h2>${cards(articles.slice(0, 3), 'berita')}` : '',
    kontak: `<h2>${escape(p.headings.contact)}</h2><p>${escape(p.headings.contactIntro)}</p><a href="mailto:${escape(p.seo.contactEmail)}">${escape(p.seo.contactEmail)}</a>`,
  };
  return `<header><a href="/">${escape(p.identity.name)}</a><nav>${p.navigation.filter(n => !n.href.startsWith('#') || visible(p, n.href.slice(1))).map(n => `<a href="${escape(n.href)}">${escape(n.label)}</a>`).join(' ')}</nav></header><main><h1>${escape(p.hero.title)} ${escape(p.hero.subtitle)}</h1><p>${escape(p.hero.chapters[0].text)}</p>${p.sections.filter(s => s.visible && parts[s.id]).map(s => `<section id="${s.id}">${parts[s.id]}</section>`).join('')}${p.showcase.visible && products.length ? `<section><h2>${escape(p.showcase.title)}</h2><p>${escape(p.showcase.intro)}</p>${cards(products.slice(0, 3), 'produk')}</section>` : ''}${p.showcase.partners.length ? `<section><h2>${escape(p.showcase.trustTitle)}</h2><ul>${p.showcase.partners.map(x => `<li>${escape(x.name)}</li>`).join('')}</ul></section>` : ''}</main>${footer(p)}`;
}
export interface PageMeta { title: string; description?: string; path?: string; content?: string; image?: string; imageAlt?: string; graph?: unknown; noindex?: boolean; type?: string; publishedAt?: string; modifiedAt?: string; markdown?: string }
export async function shell(meta: PageMeta, p?: PortalContent) {
  let html = await readFile('dist/index.html', 'utf8');
  const { title, description = '', path = '/', content = '', noindex = false } = meta;
  const image = meta.image || p?.seo.socialImage || '/social-card.png';
  const imageAlt = meta.imageAlt || p?.seo.socialImageAlt || 'MangoTek Edu';
  const tag = (name: string, value: string, property = false) => `<meta ${property ? 'property' : 'name'}="${name}" content="${escape(value)}">`;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`).replace(/<meta name="description"[^>]*>/g, '');
  const head = [tag('description', description), tag('robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
    ...(noindex ? [] : [`<link rel="canonical" href="${escape(absolute(path))}">`]),
    tag('og:type', meta.type || 'website', true), tag('og:locale', 'id_ID', true), tag('og:site_name', p?.identity.name || 'MangoTek Edu', true),
    tag('og:title', title, true), tag('og:description', description, true), tag('og:url', absolute(path), true), tag('og:image', absolute(image), true), tag('og:image:alt', imageAlt, true),
    ...(image === '/social-card.png' ? [tag('og:image:width', '1200', true), tag('og:image:height', '630', true), tag('og:image:type', 'image/png', true)] : []),
    tag('twitter:card', 'summary_large_image'), tag('twitter:title', title), tag('twitter:description', description), tag('twitter:image', absolute(image)), tag('twitter:image:alt', imageAlt),
    ...(p ? [tag('geo.region', p.seo.regionCode), tag('geo.placename', `${p.seo.region}, ${p.seo.country}`)] : []),
    ...(meta.publishedAt ? [tag('article:published_time', meta.publishedAt, true)] : []), ...(meta.modifiedAt ? [tag('article:modified_time', meta.modifiedAt, true)] : []),
    ...(meta.graph ? [`<script type="application/ld+json">${json(meta.graph)}</script>`] : []),
    ...(meta.markdown ? [`<link rel="alternate" type="text/markdown" href="${escape(absolute(meta.markdown))}">`] : []),
    ...(!noindex ? ['<link rel="describedby" type="text/markdown" href="/llms.txt">'] : []),
  ].join('\n');
  return html.replace('</head>', head + '</head>').replace('<div id="root"></div>', `<div id="root"><div class="server-content">${content}</div></div>`);
}
