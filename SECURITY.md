# Security Policy

## Supported versions

Security fixes target the latest 0.1.x release. Earlier patch versions should be upgraded. No support commitment is made for unreleased branches or modified deployments.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu/security/advisories/new). Do not open a public issue containing an exploit, credentials, school records, or personal information.

Include the affected version, deployment context, reproduction steps, expected impact, and a minimal proof of concept using synthetic data. Do not test against installations you do not own or have permission to assess. Maintainers will review reports and coordinate remediation and disclosure; response times are not guaranteed.

## Deployment responsibilities

- Terminate HTTPS at a trusted reverse proxy and configure `APP_ORIGIN` exactly. Secure session cookies are enabled for HTTPS origins.
- Keep `.env`, database backups, uploads, and logs outside public source repositories. Use separate credentials for each installation.
- Run migrations explicitly, back up before updates, and test recovery. Never run the test suite against a production database.
- Use least-privilege database accounts and restrict database network access. Configure trusted proxy hops only for infrastructure you control.
- Limit administrator accounts. Password resets and account deactivation revoke existing sessions.
- Review data retention requirements for consultation records. The current release offers manual deletion, not automated retention policies.
- Keep dependencies and container base images updated. The included controls are not a claim of regulatory certification or a substitute for an independent security review.

## Scope

Authentication, access control, draft exposure, uploads, stored content, consultation data, dependencies, and deployment configuration are relevant to this project. Cosmetic issues and general support questions belong in Issues or Discussions.
