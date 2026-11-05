# Portainer Deployment

Use [deployments/portainer.yaml](../deployments/portainer.yaml) in the Portainer **Web Editor** for a **Docker Standalone** environment. This stack runs the released application and connects to an external MariaDB server. It does not create or replace a database server.

## Connection check

On November 5, 2026, TCP connections to the initially supplied `10.1.0.18:3066` were refused. The standard port `3306` was reachable from both the development machine and staging host `10.1.0.9`. Authentication with the supplied account succeeded on `3306`, and the accessible `portalppti` database existed with zero tables. No schema changes were made during verification.

The running server reported **MariaDB 10.11.10**, rather than the requested 10.6. This stack uses that verified external endpoint. It does not install or downgrade MariaDB. Migration privileges and application behavior against this specific server still need to be verified during initialization.

Port `3654` was free on staging at the time of the check. Check it again before deployment; a port mapping cannot prevent a conflict if another service starts using that port.

## Registry access

The image is `ghcr.io/mango-teknusa-inovasi/mangotek-edu:0.1.0` for Linux AMD64. At release verification, anonymous pulls were denied. Add an authenticated `ghcr.io` registry in Portainer using a GitHub account/token with package read access, or make the package public in GitHub before deploying. Do not put registry credentials in the YAML.

## Stack creation

1. Select the target Docker Standalone environment.
2. Open **Stacks → Add stack → Web editor** and name the stack `mangotek-edu`.
3. Paste the contents of `deployments/portainer.yaml`.
4. Set these values in the stack's **Environment variables** section:

   | Variable | Value |
   | --- | --- |
   | `APP_ORIGIN` | `http://10.1.0.9:3654` if deploying on staging; otherwise use the actual host IP and port |
   | `DB_HOST` | `10.1.0.18` |
   | `DB_PORT` | `3306` |
   | `DB_NAME` | `portalppti`, verified empty during preparation |
   | `DB_USER` | `portalppti` |
   | `DB_PASSWORD` | The supplied password, entered privately in Portainer |

5. Deploy the stack after confirming that the database is still dedicated to this application.

Portainer's environment variable workflow is documented in [Add a new stack](https://docs.portainer.io/user/docker/stacks/add). Variables are explicitly mapped into the application container. Missing password or public origin prevents Compose from accepting the configuration.

The application listens on `0.0.0.0:3000` inside its container and Docker publishes it on `0.0.0.0:3654`. Open `http://HOST_IP:3654`, not `http://0.0.0.0:3654`. Set `APP_ORIGIN` to the exact browser origin so form submissions and office authentication pass origin validation. No database port is published by this stack.

## Initialize the application

The verified `portalppti` database already exists. If using a different database, create it first and grant the application account access, including the schema permissions needed for migrations. Do not point this application at an unrelated application's database.

In Portainer, open the app container's **Console**, select `/bin/sh`, and run from `/app`:

```sh
npm run db:migrate
npm run admin:create
```

The administrator command prompts for its own password. The office administrator is separate from the database account. Migrations create the application tables and initial portal content, but do not create the database itself. Until the schema is initialized, the container can run while its health status is unhealthy. A failed database connection must be corrected before initialization can succeed.

Verify `http://HOST_IP:3654/health`, the portal, and `http://HOST_IP:3654/office`. This stack deliberately leaves migrations as a separate initialization/deployment step rather than executing schema changes on every restart.

## Persistence and updates

Uploaded media is stored in the stack's `portal_data` volume. Database persistence and backups belong to the external database server. Keep both when updating; do not remove the media volume. Container logs rotate at 10 MB with three files to limit disk use.

Back up the database and media before updating the image, then run the new version's migrations once. See [Deployment and Recovery](DEPLOYMENT.md) for backup and recovery procedures. For an HTTPS reverse proxy, update `APP_ORIGIN` and configure trusted proxy hops for the actual topology.
