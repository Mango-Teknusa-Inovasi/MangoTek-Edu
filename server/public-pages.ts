import type { Hono } from 'hono';
import type { Article, Product, PortalContent } from '../src/cms/schema';
import { publicContent, publications, absolute, escape, shell, org, homeGraph, homeBody, footer, cards, breadcrumbs, articleBody, productMedia, visible, type Published } from './seo';

const md = (s: string) => s.replace(/([\\`*_{}\[\]<>])/g, '\\$1');
function portalMarkdown(p: PortalContent) {
  return `# ${md(p.identity.name)}\n\n> ${md(p.seo.description)}\n\n${md(p.hero.title)} ${md(p.hero.subtitle)}\n\n${md(p.hero.chapters[0].text)}\n\nPart of ${md(p.identity.parentName)}.\n\nWilayah: ${md(p.seo.region)}, ${md(p.seo.country)} (${p.seo.regionCode}).\n\nKontak pemasaran: ${p.seo.contactEmail}\n\n${visible(p, 'tentang') ? `## Tentang\n\n${p.about.paragraphs.map(md).join('\n\n')}\n\n` : ''}${visible(p, 'layanan') ? `## Layanan\n\n${p.services.map(s => `### ${md(s.label)}\n\n${md(s.description)}\n\n${s.needs.map(n => '- ' + md(n)).join('\n')}`).join('\n\n')}\n\n${md(p.notes.services)}\n\n` : ''}${visible(p, 'pendekatan') ? `## Pendekatan\n\n${p.steps.map((s,i) => `${i+1}. ${md(s.title)}: ${md(s.text)}`).join('\n')}\n\n${md(p.notes.approach)}\n\n` : ''}${visible(p, 'faq') ? `## Pertanyaan umum\n\n${p.faqs.map(f => `### ${md(f.q)}\n\n${md(f.a)}`).join('\n\n')}\n\n` : ''}${p.showcase.partners.length ? `## ${md(p.showcase.trustTitle)}\n\n${p.showcase.partners.map(x => '- '+md(x.name)).join('\n')}\n\n` : ''}`;
}
function documentMarkdown(a: Published, prefix: string) {
  return `# ${md(a.title)}\n\nSumber: ${absolute('/'+prefix+'/'+a.slug)}\n\nDiterbitkan: ${a.publishedAt}\nDiperbarui: ${a.modifiedAt}\n\n${md(a.summary)}\n\n${a.cover ? `![${md(a.coverAlt)}](${absolute(a.cover)})\n\n` : ''}${a.blocks.map(b => `${b.type === 'heading' ? '## ' : b.type === 'quote' ? '> ' : ''}${md(b.text)}`).join('\n\n')}${'screenshots' in a ? `\n\n${a.screenshots.map(s => `![${md(s.alt)}](${absolute(s.image)})\n\n${md(s.caption)}`).join('\n\n')}${a.videoUrl ? `\n\n## Video\n\n${a.videoUrl}\n\n${md(a.videoTranscript)}` : ''}${a.websiteUrl ? `\n\nWebsite produk: ${a.websiteUrl}` : ''}` : ''}\n`;
}
export function registerPublicPages(app: Hono<any>) {
  app.get('/api/products', async c => c.json({ items: await publications('product') }));
  app.get('/api/products/:slug', async c => {
    const a = (await publications('product')).find(x => x.slug === c.req.param('slug'));
    return a ? c.json(a) : c.json({ error: 'Produk tidak ditemukan.' }, 404);
  });
  app.get('/robots.txt', c => c.text(`User-agent: *\nAllow: /\nDisallow: /office\nDisallow: /api/\nDisallow: /health\n\nSitemap: ${absolute('/sitemap.xml')}\n`));
  app.get('/sitemap.xml', async c => {
    const [articles, products] = await Promise.all([publications('article'), publications('product')]);
    const urls: { path: string; modified?: string; image?: string }[] = [{ path: '/' }, { path: '/berita' }, { path: '/produk' }];
    for (let page = 2; page <= Math.ceil(articles.length / 9); page++) urls.push({ path: `/berita?page=${page}` });
    for (const [prefix, items] of [['berita', articles], ['produk', products]] as const) for (const a of items) urls.push({ path: `/${prefix}/${a.slug}`, modified: a.modifiedAt, image: a.cover });
    c.header('Content-Type', 'application/xml; charset=utf-8');
    c.header('Cache-Control', 'no-cache');
    return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.map(u => `<url><loc>${escape(absolute(u.path))}</loc>${u.modified ? `<lastmod>${escape(u.modified)}</lastmod>` : ''}${u.image ? `<image:image><image:loc>${escape(absolute(u.image))}</image:loc></image:image>` : ''}</url>`).join('')}</urlset>`);
  });
  app.get('/llms.txt', async c => {
    const p = await publicContent();
    const [articles, products] = await Promise.all([publications('article'), publications('product')]);
    c.header('Cache-Control', 'no-cache');
    return c.text(`# ${md(p.identity.name)}\n\n> ${md(p.seo.description)}\n\nPart of ${md(p.identity.parentName)}. Wilayah: ${md(p.seo.region)}, ${md(p.seo.country)}. Kontak pemasaran: ${p.seo.contactEmail}.\n\n## Halaman utama\n\n- [Profil, layanan, dan FAQ](${absolute('/index.md')}): Konten beranda yang telah diterbitkan.\n- [Produk dan portofolio](${absolute('/produk')}): Produk dan karya yang telah diterbitkan.\n- [Berita](${absolute('/berita')}): Kabar dan kegiatan.\n\n## Produk dan portofolio\n\n${products.map(a => `- [${md(a.title)}](${absolute('/produk/'+a.slug+'.md')}): ${md(a.summary)}`).join('\n') || 'Belum ada produk terbit.'}\n\n## Berita terbit\n\n${articles.map(a => `- [${md(a.title)}](${absolute('/berita/'+a.slug+'.md')}): ${md(a.summary)}`).join('\n') || 'Belum ada berita terbit.'}\n\n## Optional\n\n- [Teks publik lengkap](${absolute('/llms-full.txt')}): Gabungan konten publik, tanpa draf atau data pribadi.\n- [Sitemap](${absolute('/sitemap.xml')}): URL publik yang dapat diindeks.\n`);
  });
  app.get('/llms-full.txt', async c => {
    const [p, articles, products] = await Promise.all([publicContent(), publications('article'), publications('product')]);
    c.header('Cache-Control', 'no-cache');
    return c.text(portalMarkdown(p) + '\n\n' + [...products.map(a => documentMarkdown(a, 'produk')), ...articles.map(a => documentMarkdown(a, 'berita'))].join('\n\n---\n\n'));
  });
  app.get('/index.md', async c => { c.header('Content-Type', 'text/markdown; charset=utf-8'); return c.body(portalMarkdown(await publicContent())); });
  app.get('/', async c => {
    const [p, articles, products] = await Promise.all([publicContent(), publications('article'), publications('product')]);
    return c.html(await shell({ title: p.seo.title, description: p.seo.description, content: homeBody(p, articles, products), graph: homeGraph(p), markdown: '/index.md' }, p));
  });
  for (const [prefix, kind, label] of [['berita', 'article', 'Berita'], ['produk', 'product', 'Produk & Portofolio']] as const) {
    app.get('/'+prefix, async c => {
      const [p, all] = await Promise.all([publicContent(), publications(kind)]);
      const query = c.req.query();
      const page = Math.max(1, Math.min(10000, Math.floor(Number(query.page) || 1)));
      const filtered = all.filter(a => (!query.category || a.category === query.category) && (!query.q || `${a.title} ${a.summary}`.toLocaleLowerCase('id').includes(query.q.toLocaleLowerCase('id'))));
      const pageCount = Math.max(1, Math.ceil(filtered.length / 9));
      const items = prefix === 'berita' ? filtered.slice((page-1)*9, page*9) : all;
      const valid = prefix !== 'berita' || page <= pageCount;
      const path = '/'+prefix+(prefix === 'berita' && page > 1 ? '?page='+page : '');
      const title = `${label}${page > 1 && prefix === 'berita' ? ` · Halaman ${page}` : ''} | ${p.identity.name}`;
      const description = prefix === 'produk' ? p.showcase.intro : `Kabar dan kegiatan ${p.identity.name}.`;
      const content = `<header><a href="/">${escape(p.identity.name)}</a></header><main><h1>${escape(label)}</h1><p>${escape(description)}</p>${items.length ? cards(items, prefix) : '<p>Belum ada konten yang dapat ditampilkan.</p>'}${prefix === 'berita' ? `<nav aria-label="Halaman berita">${Array.from({ length: pageCount }, (_, i) => `<a href="/berita?${escape(new URLSearchParams({ ...(query.q ? {q:query.q} : {}), ...(query.category ? {category:query.category} : {}), page:String(i+1) }).toString())}">${i+1}</a>`).join(' ')}</nav>` : ''}</main>${footer(p)}`;
      return c.html(await shell({ title, description, path, content, noindex: !valid || !!query.q || !!query.category, graph: { '@context': 'https://schema.org', '@graph': [org(p), breadcrumbs('/'+prefix, label), { '@type': 'CollectionPage', url: absolute(path), name: title, mainEntity: { '@type': 'ItemList', itemListElement: items.map((a,i) => ({ '@type': 'ListItem', position: (prefix === 'berita' ? (page-1)*9 : 0)+i+1, url: absolute('/'+prefix+'/'+a.slug), name: a.title })) } }] } }, p), valid ? 200 : 404);
    });
    app.get('/'+prefix+'/:slug', async c => {
      const slugParam = c.req.param('slug') || '';
      const markdown = slugParam.endsWith('.md');
      const slug = markdown ? slugParam.slice(0, -3) : slugParam;
      const [p, items] = await Promise.all([publicContent(), publications(kind)]);
      const a = items.find(x => x.slug === slug);
      const path = '/'+prefix+'/'+slug;
      if (!a) { c.header('X-Robots-Tag', 'noindex'); return markdown ? c.text('Konten tidak ditemukan.', 404) : c.html(await shell({ title: 'Konten tidak ditemukan', path, noindex: true, content: `<main><h1>Konten tidak ditemukan</h1><a href="/${prefix}">Kembali ke ${escape(label)}</a></main>` }, p), 404); }
      if (markdown) { c.header('Content-Type', 'text/markdown; charset=utf-8'); c.header('Link', `<${absolute(path)}>; rel="canonical"`); return c.body(documentMarkdown(a, prefix)); }
      const graph = { '@context': 'https://schema.org', '@graph': [org(p), breadcrumbs(path, a.title, { path: '/'+prefix, title: label }), { '@type': kind === 'article' ? 'Article' : 'CreativeWork', '@id': absolute(path+'#content'), url: absolute(path), mainEntityOfPage: absolute(path), headline: a.title, name: a.title, description: a.summary, inLanguage: 'id-ID', ...(a.cover ? { image: absolute(a.cover) } : {}), datePublished: a.publishedAt, dateModified: a.modifiedAt, publisher: { '@id': absolute('/#organization') } }] };
      return c.html(await shell({ title: a.seoTitle || `${a.title} | ${p.identity.name}`, description: a.seoDescription || a.summary, path, content: `<header><a href="/">${escape(p.identity.name)}</a> / <a href="/${prefix}">${escape(label)}</a></header><main><article>${articleBody(a)}${kind === 'product' ? productMedia(a as Product) : `<time datetime="${escape(a.publishedAt)}">${escape(new Date(a.publishedAt).toLocaleDateString('id-ID', { dateStyle:'long', timeZone:'Asia/Jakarta' }))}</time>`}</article></main>${footer(p)}`, image: a.cover, imageAlt: a.coverAlt, graph, type: kind === 'article' ? 'article' : 'website', ...(kind === 'article' ? { publishedAt:a.publishedAt, modifiedAt:a.modifiedAt } : {}), markdown: path+'.md' }, p));
    });
  }
}
