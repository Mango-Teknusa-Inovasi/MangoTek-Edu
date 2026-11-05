# Architecture

## Application boundaries

The browser uses React and Vite. Hono serves the built assets, APIs, uploaded images, and HTML for news routes. `/office` is loaded as a separate frontend chunk. Three.js scenes are lazy-loaded and do not form part of the office bundle.

```text
Public portal / Office
          |
       Hono API
          |
  Validation + authorization
          |
  Knex repository + migrations
          |
 SQLite OR PostgreSQL OR MariaDB

Uploaded images -> persistent local storage
```

## Source map

| Location | Responsibility |
| --- | --- |
| `src/App.tsx` | Public portal composition |
| `src/cms/` | Content schemas, office UI, news UI, API client, portal context |
| `src/components/` | Portal interactions and 3D scenes |
| `server/app.ts` | HTTP routes, sessions, authorization, publishing, media, inquiries |
| `server/db.ts`, `server/repository.ts` | Database configuration and content access |
| `server/migrations.ts` | Versioned schema and initial seed |
| `scripts/manage.ts` | Setup, migration, administrator, and backup commands |
| `scripts/test-api.ts`, `tests/` | Database/API integration and browser tests |

## Content and publication

Documents keep a mutable draft and a separate published snapshot. Edits increment a revision number. Writes with a stale revision return HTTP 409 instead of replacing newer content. Publishing records an immutable version and updates the public snapshot in a transaction. Editors can draft and request review; administrators publish and manage identity settings.

Portal sections use a fixed schema rather than arbitrary executable templates. The hero remains first and the footer last. Articles use paragraph, heading, and quotation blocks rendered as text; arbitrary HTML and scripts are not accepted.

Content writes and media deletion use a common database row lock. Uploaded references are checked before saving/publishing; files referenced by drafts, published content, or archived versions cannot be deleted.

## Public API

| Route | Behavior |
| --- | --- |
| `GET /api/portal` | Published portal content |
| `GET /api/news` | Published news; `q`, `category`, and `page` filters |
| `GET /api/news/:slug` | One published article |
| `POST /api/inquiries` | Validated, rate-limited consultation submission |
| `GET /health` | Database/content readiness |

News detail HTML includes escaped article content and metadata before JavaScript executes. Draft article URLs return 404 publicly. Authenticated previews use `/office/preview/:id` and are marked noindex.

## Office API and security

`POST /api/login` creates a server-side session. Office routes under `/api/office/*` validate the session; mutations also require its CSRF token. The client receives this token from login or the session endpoint and sends it in `X-CSRF-Token`. Session identifiers are stored as hashes; passwords are hashed using scrypt. Secure cookies are enabled when `APP_ORIGIN` uses HTTPS.

Office route groups cover documents, media, users, inquiries, and CSV reports. Consultation records and user management require administrator access. Mutations are subject to server-side authorization independently of visible controls.

Consultation requests require a name, organization, at least one valid contact method, selected services, a message, and consent. A unique request identifier makes retries idempotent. Successful responses are returned after persistence. CSV export quotes values and neutralizes spreadsheet formulas.

## Storage and portability

Each installation uses one Knex dialect. The schema uses portable column types, ISO UTC timestamp strings, and serialized structured content. SQLite uses WAL mode and a single pooled connection. Server engines use connection pools. Database selection and credentials are server-only.

The implementation favors consistent behavior across engines over vendor-specific full-text search or JSON indexes. News filtering currently operates on published documents in application memory; larger installations should measure this workload before extending it.

## 3D and accessibility

Native scrolling drives the story timeline. User rotation and story transforms are separate. Offscreen or hidden-tab rendering is paused. Reduced motion, module failure, or WebGL loss falls back to normal-flow illustrations. Scenes support direct pointer and keyboard interaction without visible instructional control rows.
