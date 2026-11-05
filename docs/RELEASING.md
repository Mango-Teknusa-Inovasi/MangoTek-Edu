# Release Process

## Versioning

Use `vMAJOR.MINOR.PATCH` Git tags and the matching version in `package.json` and `package-lock.json`. Record changes in CHANGELOG.md before tagging. Pre-1.0 breaking changes must be documented explicitly.

## Maintainer checklist

1. Review changes, licensing notices, migrations, and recovery instructions.
2. Update package versions and add a dated changelog section.
3. Run the local checks and wait for CI on the release commit to pass.
4. Create and push an annotated tag, for example:

   ```sh
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

5. Watch the Release workflow. Do not replace a published tag to fix a failure; rerun a failed workflow when appropriate or issue a new version for code changes.
6. Verify the GitHub release, package digest, and image pull permissions.

## Automation

CI runs TypeScript/build checks, Chromium browser tests, SQLite/PostgreSQL/MariaDB API tests, and a Docker build/smoke test. The release workflow reuses these checks before publishing.

Successful version tags publish a Linux AMD64 image to `ghcr.io/mango-teknusa-inovasi/mangotek-edu` with the version and commit tags. Stable releases also update `latest`. The workflow creates a GitHub Release using the matching changelog section and attaches a frontend asset archive with SHA-256 checksums. The frontend archive is not a standalone backend installation; use the container or repository source for the complete application.

Publishing uses the repository's `GITHUB_TOKEN` with explicit package/content permissions. No registry password or deployment SSH key is needed. Actions are pinned to commit SHAs and Dependabot proposes updates.

Repository visibility and GHCR package visibility are separate settings. If the initial package is private, an organization/package administrator must adjust access or visibility according to the intended distribution. No workflow automatically deploys to staging or production.

## Release failure

Inspect the failed job before retrying. A successful package build alone is not proof that the application has migrated or been deployed. Back up persistent data before updating an installation, and follow docs/DEPLOYMENT.md for recovery.
