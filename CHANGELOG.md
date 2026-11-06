# Changelog

Notable changes are recorded here. Releases use Semantic Versioning; while the project is below 1.0, minor releases may include breaking changes that will be called out explicitly.

## [Unreleased]

No changes yet.

## [0.2.2] - 2026-11-06

### Added

- Inline image upload and drag-and-drop controls for brand logos, organization logos, covers, screenshots, and social images.
- A searchable thumbnail library with keyboard focus handling, upload progress, cancellation, and retry feedback.
- Optional private S3-compatible and Cloudflare R2 storage configured through server environment variables.
- Per-media storage locations, stable public image URLs, optimized dimensions, and mixed local/cloud image delivery.
- S3-compatible integration tests, legacy migration checks, storage-failure cleanup checks, and responsive media workflow tests.

### Fixed

- Organization logo fields use context-specific labels and no longer require selecting a URL from a dropdown.
- Completing an asynchronous upload preserves edits made to other fields during the transfer.
- Saving and publishing wait for active image uploads to finish.

### Upgrade

- **Run `npm run db:migrate` using the new image.** Migration `002_media_storage` is required; health checks report an error until it is applied.
- Existing uploads remain local. Cloud storage is optional and does not move existing files. See [media storage and Portainer instructions](docs/MEDIA-STORAGE.md).
- Real AWS S3/R2 credentials were not supplied; cloud behavior is verified against an isolated S3-compatible emulator.

## [0.2.1] - 2026-11-05

### Changed

- Office opens with real content totals, task shortcuts, and recent revisions.
- Portal editing uses a section navigator and compact repeatable items; news and products group related fields.
- Sticky save controls, visible progress and publication states, protected navigation, and retryable errors make editorial work easier.
- Content lists support title/category search and publication status filters.
- Responsive office navigation, keyboard focus, and reduced-motion transitions improve daily use.
- Stable releases explicitly publish the `latest` container tag, with Portainer update instructions.

### Fixed

- Saved document metadata is kept in sync when switching between portal content and settings.
- Superseded consultation filter requests no longer replace newer results.

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
