# MangoTek Edu

[![CI](https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu/actions/workflows/ci.yml/badge.svg)](https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/project%20license-MIT-green.svg)](LICENSE)

An education portal and editorial workspace for MangoTek Edu, part of Mango Teknusa Inovasi. It connects a public K–12 services website with news publishing and school consultation management.

The application interface is currently in Indonesian. Project documentation, issue templates, and contribution guidelines are in English.

## What is included

- Interactive school and device scenes built with Three.js, with reduced-motion and WebGL fallbacks.
- A structured page editor at `/office`: identity, navigation, colors, section order, service descriptions, FAQs, and supported 3D presets.
- Admin and editor roles, drafts, review requests, authenticated previews, and atomic publication with revision conflict detection.
- Public news pages with categories, search, pagination, server-rendered article content, and social metadata.
- School consultation submissions with private contact details, status tracking, internal notes, filters, and CSV reports.
- One selectable database per installation: SQLite, PostgreSQL, or MariaDB.
- Image uploads, persistent storage, an interactive setup command, Docker packaging, and automated checks.

No external CMS, authentication provider, or email service is required. Email notifications, scheduled publishing, multi-tenancy, and automatic migration between database engines are not included.

## Quick start

Requirements: **Node.js 24 LTS**, npm, and optionally a PostgreSQL or MariaDB server. SQLite works without a separate database service.

```sh
git clone https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu.git
cd MangoTek-Edu
npm ci
npm run setup
npm run db:migrate
npm run admin:create
npm run build
npm start
```

Open <http://127.0.0.1:3000> for the portal and <http://127.0.0.1:3000/office> for the editorial workspace.

Setup creates a local `.env` without overwriting an existing file. The administrator command prompts for a password without displaying it; there are no default administrator credentials. Database credentials and office accounts are separate. To configure manually, copy `.env.example` to `.env` before running migrations.

`APP_ORIGIN` must exactly match the address used in the browser. Use HTTPS in production. Never expose database credentials through `VITE_*` variables or commit `.env`.

## Docker and packages

The release workflow publishes the application image to:

```text
ghcr.io/mango-teknusa-inovasi/mangotek-edu:latest
```

The `latest` tag follows stable releases. In Portainer, choose **Pull latest image** when updating the stack; an unchanged tag does not download a new image automatically. Version tags and digests remain available for rollbacks. The image targets Linux AMD64; other platforms can build from source.

For a local source build:

```sh
cp .env.example .env
# Edit the database settings and APP_ORIGIN.
docker compose up -d --build
docker compose exec app npm run db:migrate
docker compose exec app npm run admin:create
```

See [Deployment](docs/DEPLOYMENT.md) for Compose profiles, published images, persistent volumes, reverse proxies, and backup procedures. Initial startup becomes healthy after the database migration completes.

## Development and checks

After configuration and migration, run these in separate terminals:

```sh
npm run dev:api
npm run dev
```

The development UI is available at <http://127.0.0.1:5173>. Vite proxies API and media requests to Hono on port 3000.

```sh
npm run typecheck
npm run build
npm test
```

Local browser tests use installed Google Chrome. CI installs Playwright Chromium. Use a development database: browser tests create temporary accounts and submissions. API tests require a dedicated test database:

```sh
DB_DRIVER=sqlite SQLITE_PATH=/tmp/mangotek-test.sqlite npm run test:api
```

CI checks TypeScript, production builds, browser behavior and accessibility, all three database engines, and the Docker image. Tagging a release runs these checks again before publication.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Deployment](docs/DEPLOYMENT.md) | Configuration, Docker, updates, backup, and recovery |
| [Architecture](docs/ARCHITECTURE.md) | Application structure, content flow, storage, and API boundaries |
| [Office guide](docs/OFFICE.md) | Editing, publishing, media, and consultation reports |
| [Release process](docs/RELEASING.md) | Versioning, CI gates, packages, and release assets |
| [Search and portfolio](docs/SEO.md) | SEO, sitemap, social previews, machine-readable content, and products |
| [Contributing](CONTRIBUTING.md) | Local development and pull request expectations |
| [Security policy](SECURITY.md) | Supported releases and private vulnerability reports |
| [Changelog](CHANGELOG.md) | User-visible changes by release |
| [Design](DESIGN.md) | Visual identity, motion, and accessibility decisions |

## Contributing and support

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request. Report reproducible bugs through GitHub Issues and use [Discussions](https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu/discussions) for usage questions. Follow [SECURITY.md](SECURITY.md) for vulnerabilities; do not include private school data or credentials in public reports.

## License and attribution

Original project code is available under the [MIT License](LICENSE). Contributions are accepted under that license. Third-party components, libraries, and fonts retain their own terms; the root MIT license does not relicense them. In particular, the vendored React Bits components use MIT plus the Commons Clause, and GSAP uses its own license. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

MangoTek names and logos identify this project and its organization. The software license does not grant trademark rights or imply endorsement of derivative deployments.

Image uploads support local storage or a private S3/R2 bucket. See [media storage and Portainer upgrade instructions](docs/MEDIA-STORAGE.md). Existing installations must run the new media migration after upgrading.
