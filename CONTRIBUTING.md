# Contributing

Contributions of code, documentation, accessibility improvements, and reproducible bug reports are welcome.

## Before making a change

For substantial changes, open an issue describing the problem and proposed behavior. Check existing issues first. Keep small fixes focused. Follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Development setup

1. Fork and clone the repository.
2. Install Node.js 24 LTS, then run `npm ci`.
3. Run `npm run setup`, `npm run db:migrate`, and `npm run admin:create` against a local database.
4. Start `npm run dev:api` and `npm run dev` in separate terminals.
5. Create a branch with a descriptive name.

Never commit `.env`, real consultation data, passwords, database files, or backups. Use synthetic data in screenshots and tests.

## Code and documentation

- Use TypeScript and validate untrusted input at the server boundary.
- Preserve the separation between drafts and published content and enforce authorization server-side.
- Keep schema migrations portable across SQLite, PostgreSQL, and MariaDB. Add a new migration rather than changing a migration already included in a release.
- Preserve keyboard interaction, visible focus, reduced-motion behavior, and static 3D fallbacks.
- Write documentation, comments, commit messages, and pull request descriptions in English. The current user-facing UI remains Indonesian.
- Explain non-obvious decisions; avoid comments that simply repeat the code.
- Add tests for meaningful behavior changes and update the changelog when users or operators are affected.
- Preserve license notices and document new third-party assets or components. Do not submit code you are not entitled to contribute.

## Verification

```sh
npm run typecheck
npm run build
npm test
DB_DRIVER=sqlite SQLITE_PATH=/tmp/mangotek-contribution-test.sqlite npm run test:api
```

Browser tests use local Chrome. Database changes must also pass the PostgreSQL and MariaDB CI jobs. See [Deployment](docs/DEPLOYMENT.md) for database settings.

## Pull requests

Use a concise English title, describe the problem and resulting behavior, and include verification results. Add screenshots for visual changes and migration/recovery notes for storage changes. Keep unrelated refactors in separate pull requests. A passing CI run is required before a change is ready to merge; maintainers may request revisions.

Suggested commit format: `fix: preserve draft content after a failed save` or `feat: add a news category filter`. Do not amend or force-push shared branches without coordinating with their users.

## License

By submitting original contributions, you agree that they may be distributed under this project's MIT license. Third-party material must retain its applicable license and attribution. No contributor license agreement is required for this initial release.
