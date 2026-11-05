# Changelog

Notable changes are recorded here. Releases use Semantic Versioning; while the project is below 1.0, minor releases may include breaking changes that will be called out explicitly.

## [Unreleased]

No changes yet.

## [0.2.0] - 2026-11-05

### Added

- Server-readable public home content, canonical and social metadata, organization/service/FAQ structured data, and publication-aware news metadata.
- Dynamic XML sitemap, robots.txt, llms.txt, llms-full.txt, and Markdown representations of public content.
- A branded 1200 × 630 social card, editable SEO/contact/region settings, and the public marketing contact.
- Product and portfolio publishing with screenshots, external video links, transcripts, protected previews, and homepage work samples.
- An initially empty, editable trust-logo section that appears only after real entries are published.
- Automated SEO/publication-isolation checks and responsive product browser tests.

## [0.1.0] - 2026-11-05

### Added

- Public K–12 education portal with a standalone MangoTek Edu identity and parent organization attribution.
- Interactive school diorama, scroll-driven device story, and interactive media throughout the page.
- Reduced-motion, lazy-loading, offscreen rendering, and WebGL failure fallbacks.
- Structured portal editing, admin/editor accounts, drafts, review requests, and authenticated previews at `/office`.
- Atomic publication, publication snapshots, and optimistic revision checks.
- Public news listing and detail pages with categories, search, pagination, structured article blocks, and server-rendered SEO metadata.
- Validated image uploads with WebP conversion and protection against deleting referenced media.
- Consultation submissions, consent, idempotency, internal notes, status tracking, filtered reports, and CSV export.
- SQLite, PostgreSQL, and MariaDB support through Knex, with installation-time selection and explicit migrations.
- Interactive setup and administrator recovery commands, Docker Compose profiles, and backup documentation.
- CI for browser and database tests, Docker image checks, and release publishing to GitHub Container Registry.
- MIT licensing for original project code and preserved third-party notices.

### Security

- Password hashing, server-side sessions, CSRF checks, origin validation, role authorization, and request throttling.
- Private consultation access restricted to administrators, with deletion controls.
- Structured article rendering without arbitrary HTML, upload format validation, and CSV formula neutralization.

### Known limitations

- The application UI is in Indonesian; internationalization is not included.
- Database engine changes require a separate data migration; changing environment variables does not transfer existing records.
- No automated email delivery, WhatsApp API integration, publication scheduling, or multi-tenancy.
- The shared Three.js renderer remains a large lazy-loaded chunk. Physical-device and production load testing are not part of this release.
- The published container targets Linux AMD64.

[Unreleased]: https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu/releases/tag/v0.1.0
