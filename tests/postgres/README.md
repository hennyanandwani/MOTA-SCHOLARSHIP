# Isolated PostgreSQL concurrency harness

**Execution is not authorized by this preparation.** Do not run these commands
until a separate approval explicitly authorizes Docker startup, schema sync, or
database tests.

## Isolation design

The Compose project contains only a PostgreSQL service and a one-shot Node test
runner. Both attach only to a Compose `internal: true` network. PostgreSQL has
no published host port, no host database directory, and uses tmpfs. The runner
has no host port, no Docker socket, and no external network. It receives only
test-specific environment values.

The runner mounts selected source files, the generated Prisma client, the
Prisma schema, `package.json`, and `node_modules` read-only. It does not mount
the repository root or any `.env` file. No Supabase credentials, production
database credentials, Storage keys, or Docker socket are passed to it.

The database URL is assembled from test-only Compose values and addresses the
internal service name `postgres`. `safety.ts` rejects every other host and
requires the dedicated database, role, port, explicit test opt-in, and a
URL-safe password. Before schema operations and fixture creation, the runner
checks the server-reported database, role, TCP address, and port. The network
topology limits that service name to the database container in this project.
These checks do **not** prove the identity of the Docker host or protect
against a compromised Docker daemon or host; localhost/internal names alone
are not a complete security boundary.
The Prisma CLI opens a separate connection after wrapper verification; the
isolation control is that its allowlisted URL can resolve only to the
PostgreSQL service on this internal network, not that the two connections are
the same session.

## Test-only prerequisites

1. After separate approval, copy `.env.example` to the ignored
   `tests/postgres/.env.local`. Set `FELLOWSHIFT_TEST_POSTGRES_PASSWORD` to a
   new random password of at least 32 characters containing only letters,
   digits, `_`, or `-`; do not reuse any application, Supabase, or production
   credential. Set `COMPOSE_PROJECT_NAME` to
   `fellowshift-pgtest-<unique-lowercase-suffix>` for this run. Set
   `FELLOWSHIFT_RUN_POSTGRES_TESTS=1` only after a separate approval explicitly
   authorizes running the database tests. Keep this file local and untracked.
2. Use `--env-file tests\postgres\.env.local` explicitly in every Compose
   command. This avoids relying on the repository's default `.env` discovery.
   The test runner receives only the explicitly declared test environment; it
   does not receive the Compose env file itself.
3. Use a Docker installation capable of running `node:22-bookworm-slim` and
   `postgres:16-alpine`. Image availability/pulling requires separate
   approval. Do not configure host networking, port forwarding, external
   networks, or a database proxy.

## Commands for a separately approved run

The following are instructions only; none were executed during preparation.
Run them from the repository root and set `$projectName` to the exact value of `COMPOSE_PROJECT_NAME` in `.env.local`.

1. Start only the disposable database. Compose will create the internal network
   and tmpfs-backed service; this does not publish a host port:

   ```powershell
   $projectName = "fellowshift-pgtest-your-unique-suffix"
   docker ps -a --filter "label=com.docker.compose.project=$projectName"
   docker network ls --filter "label=com.docker.compose.project=$projectName"
   docker volume ls --filter "label=com.docker.compose.project=$projectName"
   ```

   If any preflight command lists a resource, choose a different unique project
   name; do not remove or reuse the existing project. Then start the database:

   ```powershell
   docker compose --env-file tests\postgres\.env.local -f tests\postgres\docker-compose.yml -p $projectName up -d postgres
   $containerId = docker compose --env-file tests\postgres\.env.local -f tests\postgres\docker-compose.yml -p $projectName ps -q postgres
   docker inspect --format '{{range .Mounts}}{{println .Destination .Type}}{{end}}' $containerId
   ```

   Confirm `/var/lib/postgresql/data` is reported as `tmpfs` and no database
   data directory is reported as a Docker volume before proceeding.

2. Verify the database target from the isolated runner:

   ```powershell
   docker compose --env-file tests\postgres\.env.local -f tests\postgres\docker-compose.yml -p $projectName run --rm runner tests/postgres/verify-target.ts
   ```

   It checks `current_database()`, `current_user`, `inet_server_addr()`, and
   `inet_server_port()` through the internal `postgres` service name. Stop if
   verification fails.
3. Only after separately approving schema synchronization, run the wrapper
   with its required acknowledgement:

   ```powershell
   docker compose --env-file tests\postgres\.env.local -f tests\postgres\docker-compose.yml -p $projectName run --rm -e FELLOWSHIFT_ALLOW_TEST_SCHEMA_SYNC=I_ACKNOWLEDGE_TEST_SCHEMA_SYNC runner tests/postgres/schema-sync.ts
   ```

   The wrapper requires test opt-in and schema acknowledgement, verifies the
   target, and launches Prisma with an allowlisted environment and the test-only
   config. It does not pass `DATABASE_URL`, load dotenv, or use destructive
   flags such as `--force-reset` or `--accept-data-loss`.
4. Only after separately approving database integration tests, run:

   ```powershell
   docker compose --env-file tests\postgres\.env.local -f tests\postgres\docker-compose.yml -p $projectName run --rm runner
   ```

   The suite uses synthetic database records and in-memory Storage mocks. It
   does not call Supabase or external services.
5. Shut down and remove the disposable project:

   ```powershell
   docker compose --env-file tests\postgres\.env.local -f tests\postgres\docker-compose.yml -p $projectName down --volumes --remove-orphans
   docker volume ls --filter "label=com.docker.compose.project=$projectName"
   docker network ls --filter "label=com.docker.compose.project=$projectName"
   ```

   No named volumes are declared; the database uses tmpfs. Confirm the volume
   listing is empty for the project and its network listing is empty after
   teardown. During the run, inspect the database container's mounts and verify
   that `/var/lib/postgresql/data` is tmpfs, not a Docker volume. Remove the
   local `.env.local` only after the project is stopped and the local-only
   password is no longer needed.

## Coverage and limitations

The concurrency tests exercise the Prisma parent-row update protocol directly,
not Next.js handlers. They use unique transaction `application_name` values
and poll `pg_stat_activity` until PostgreSQL reports the competing operation
waiting on a lock before releasing the transaction holding it. This is
PostgreSQL-observable synchronization with a bounded timeout, not a sleep-based
assumption. The tests do not establish HTTP route behavior.

The lock-timeout test checks PostgreSQL SQLSTATE `55P03`. The Storage tests are
deterministic in-memory examples for a possibly persisted upload that reports
failure, failed cleanup, and preserving an object marked as referenced. They
are not connected to the production upload route and do not claim end-to-end
Storage coverage. Orphan objects remain possible when Storage persistence or
cleanup outcomes are ambiguous.

Do not use tunnels, proxies, host networking, or port forwarding. An internal
service name is a topology constraint, not proof against a malicious/compromised
host, Docker daemon, or altered Compose configuration.
