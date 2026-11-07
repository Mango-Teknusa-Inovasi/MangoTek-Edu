# Loading and performance

Version 0.2.3 replaces corner text with a centered Edu mark and a short loading message. The mark floats gently with a mango accent; reduced-motion mode is static. Loading never adds an artificial minimum delay. Skeletons preserve the structure of office panels and public views that lack usable initial data.

Public HTML stays readable while its route module and data are prepared. Published portal/page data is embedded as escaped inert JSON and reused for the first client render. Private drafts, session/CSRF values, inquiries, and user records are never embedded. Office session, document, and media reads have separate error and pending states, so a failed media library does not block text editing.

Read requests use a 20-second timeout, with additional loading feedback after 10 seconds. Existing results remain visible during filtered refreshes; abandoned reads are canceled and cannot overwrite newer results. Saving and uploads keep their existing business behavior and are not automatically retried.

## Local measurements

Three cold runs per profile were recorded before and after the change using the same empty seeded SQLite portal and local Hono server. The harness uses headless Chrome, PerformanceObserver paint/layout entries, and Chrome DevTools Protocol throttling. Desktop uses 1440 × 900 without throttling. Mobile uses 375 × 900, device scale factor 1, CPU throttling 4×, 150 ms network latency, 1.6 Mbps download, and 750 Kbps upload.

The observation window is 10 seconds on desktop and 20 seconds on mobile after DOMContentLoaded. Values below are medians. Resource transfer is the sum of recorded resource `transferSize` values and excludes the HTML navigation response; it includes deferred 3D resources completed during the window. Initial entry gzip sizes are calculated by the same Node zlib harness for both builds.

| Metric | Before | After |
| --- | ---: | ---: |
| Entry JavaScript, raw | 317,682 bytes | 231,750 bytes |
| Entry JavaScript, gzip | 96,958 bytes | 72,082 bytes |
| Resource transfer, desktop/mobile | 1,702,068 bytes | 573,120 bytes |
| Resource requests | 16 | 14 |
| Initial public API requests | 3 | 0 |
| Desktop FCP | 220 ms | 64 ms |
| Desktop LCP | 756 ms | 140 ms |
| Desktop CLS | 0 | 0.0010 |
| Mobile FCP | 1,140 ms | 516 ms |
| Mobile LCP | 5,540 ms | 3,540 ms |
| Mobile CLS | 0.0098 | 0.0098 |

Local results are not production field metrics, a Lighthouse score, or an INP measurement. Desktop timings are especially sensitive to host scheduling. The small desktop CLS difference is reported rather than hidden. An automated production request during planning received HTTP 403, so this comparison makes no production speed claim. Saved JSON reports and loading screenshots are under ignored `artifacts/performance/` and `artifacts/loading/`.

## Repeating a measurement

Build the version you want to measure, migrate a dedicated test database, and start it separately from any development server:

```sh
npm run build
DB_DRIVER=sqlite SQLITE_PATH=/tmp/mangotek-performance-test.sqlite npm run db:migrate
DB_DRIVER=sqlite SQLITE_PATH=/tmp/mangotek-performance-test.sqlite npm start
```

Then, in another terminal:

```sh
npm run perf -- measurement
```

The command writes `artifacts/performance/measurement.json`. Labels only name reports; they do not switch application versions. Compare separately built versions using the same fixture, browser, machine, viewport, observation window, and throttling. `PERF_ORIGIN` overrides the default `http://127.0.0.1:3000`; the harness reads entry sizes from the local `dist` directory, which must match the served build. Local runs use the installed Chrome channel, while CI can use Playwright Chromium with `CI=true`.

## Delivery and caching

The build creates `.br` and `.gz` companions for JavaScript and CSS. Hono negotiates them using `Accept-Encoding` and sends `Vary: Accept-Encoding`. Hashed JavaScript/CSS/font assets use a one-year immutable cache; missing assets do not receive that policy. Images retain their existing immutable UUID URLs. Public HTML uses `no-cache`; private APIs and office responses remain `no-store`.

A reverse proxy can forward these responses without recompressing already encoded assets. Keep `Vary` and `Content-Encoding` intact. New builds use new hashed URLs, so an office update must preserve the app/data volume but should not reuse stale HTML as an immutable asset.

No new migration is introduced by 0.2.3. Existing installations upgrading from before 0.2.2 must still run `npm run db:migrate` for the previous media-storage migration.
