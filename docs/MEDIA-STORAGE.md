# Images and storage

Office image fields accept direct uploads, drag and drop, and a searchable thumbnail library. Uploaded images are selected immediately; save the draft and publish it to update the public portal. Organization logos use the same workflow as covers and screenshots. Replacing a selection does not delete its previous media asset.

Uploads accept PNG, JPEG, and WebP up to 5 MiB. The server inspects the image bytes, applies orientation, limits decoded pixels, fits the result within 2000 × 2000 pixels without enlargement, and encodes WebP while retaining transparency. SVG, video uploads, and image cropping are outside this release. Built-in SVG brand assets remain selectable.

## Upgrade from 0.2.1 or earlier

This release adds migration `002_media_storage`. Back up the database and uploads, pull the new image, and run the migration using that image before normal use. The initial seed does not overwrite portal content.

For the existing Portainer stack, update using `ghcr.io/mango-teknusa-inovasi/mangotek-edu:latest` with **Pull latest image** enabled. Open the app container console and run:

```sh
npm run db:migrate
```

From a shell on the Docker host, the equivalent is:

```sh
docker exec mangotek-edu-app-1 npm run db:migrate
```

The health check reports an error until the media migration is applied. Keep the existing environment and persistent volume. After migration, check `/health`, office login, one image upload, and public image delivery. Rollback should use the matching image and database/media backup.

## Local storage

Local storage remains the default and needs no cloud account:

```dotenv
STORAGE_DRIVER=local
UPLOAD_DIR=/app/data/uploads
```

Keep `/app/data` on the existing persistent volume. Migration marks existing media as local; old filenames and public URLs remain unchanged.

## Private S3 or R2 storage

The browser uploads to the authenticated portal endpoint. The portal validates and optimizes the image, then writes it to the bucket using the server-side S3 SDK. It streams public images through `/uploads/<id>.webp`. A public bucket, public bucket URL, browser credentials, bucket CORS rules, and a CDN hostname are not required.

For AWS S3:

```dotenv
STORAGE_DRIVER=s3
S3_BUCKET=your-existing-bucket
S3_REGION=ap-southeast-1
S3_ENDPOINT=
S3_ACCESS_KEY_ID=replace-on-server
S3_SECRET_ACCESS_KEY=replace-on-server
S3_PREFIX=mangotek/uploads
S3_FORCE_PATH_STYLE=false
```

For Cloudflare R2:

```dotenv
STORAGE_DRIVER=s3
S3_BUCKET=your-existing-bucket
S3_REGION=auto
S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=replace-on-server
S3_SECRET_ACCESS_KEY=replace-on-server
S3_PREFIX=mangotek/uploads
S3_FORCE_PATH_STYLE=false
```

Use an existing bucket dedicated to this portal or a dedicated prefix. The runtime needs read, put, and delete access to its image objects. It does not create buckets or change their access policy. Keep keys in the server environment or Portainer environment settings; never place them in `VITE_*`, source control, image build arguments, or browser configuration.

Add these entries beneath the existing Portainer app environment, replacing the example bucket/account settings:

```yaml
environment:
  STORAGE_DRIVER: s3
  S3_BUCKET: your-existing-bucket
  S3_REGION: auto
  S3_ENDPOINT: https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
  S3_ACCESS_KEY_ID: "${S3_ACCESS_KEY_ID}"
  S3_SECRET_ACCESS_KEY: "${S3_SECRET_ACCESS_KEY}"
  S3_PREFIX: mangotek/uploads
  S3_FORCE_PATH_STYLE: "false"
```

Retain all existing app, database, origin, proxy, and upload-volume configuration. The repository Compose file forwards these variables too. `S3_FORCE_PATH_STYLE=true` is available for compatible services that require path-style requests. HTTP endpoints are intended for isolated local emulators; use HTTPS for production bucket endpoints.

Incomplete cloud configuration prevents app startup with a configuration error. A bucket outage fails the upload with a retryable message and does not silently write the image locally. Existing selections and other form fields remain intact after an unsuccessful upload.

## Existing media and backups

Each media row records its storage driver, object key, and bucket. Changing `STORAGE_DRIVER` only changes where new uploads are written. Local and cloud images can coexist. Keep the local volume mounted while any image uses it. Keep the S3 endpoint, region, and credentials configured while any cloud image uses them, even when new uploads are local.

This release supports one configured S3 endpoint/account at a time. Changing accounts/endpoints or moving existing objects to another bucket requires a separate media migration; changing ENV does not copy files.

Back up the database, local uploads, and cloud objects from the same maintenance window. Store the bucket configuration and recoverable credentials separately from public documentation. Recovery must restore the object keys referenced by the database. Object storage is not an automatic backup; configure retention/versioning with the provider if required.

Deleting media checks current drafts, published content, and saved publication versions first. Referenced media cannot be deleted. Unused uploads remain in the library until an admin deletes them. Cancellation stops the browser request; a request already being processed on the server may still finish and leave an unused library asset.

## Verification

CI tests migrations and upload APIs on SQLite, PostgreSQL, and MariaDB. A separate isolated Moto S3-compatible service exercises bucket reads/writes/deletes, mixed local/cloud media, missing objects, outages, and the full upload API. Browser tests cover direct upload, logos, thumbnail selection, focus, mobile layouts, cancellation, retry, and publication.

To run the adapter integration locally against an existing temporary S3-compatible emulator:

```sh
TEST_S3_ENDPOINT=http://127.0.0.1:5197 npm run test:storage
```

The test creates and removes its own uniquely named bucket using disposable `test` credentials. Do not point it at production. A real AWS S3/R2 account is not exercised by CI; verify a controlled upload/read/delete after configuring your actual bucket. No real R2 credentials were supplied for this release.
