#!/usr/bin/env bash
# Exercise the production build against a fresh database owned by this run.
set -euo pipefail

export NODE_ENV=production AI_PROVIDER=rules NEXT_TELEMETRY_DISABLED=1
export HASH_SECRET POSTGRES_PASSWORD DATABASE_URL BASE_URL NEXT_PUBLIC_SITE_URL
HASH_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 32)
container=$(docker run --detach --rm --publish 127.0.0.1::5432 \
  --env POSTGRES_PASSWORD --env POSTGRES_DB=seniorseat_ci postgres:17-alpine)
server_pid=
server_stderr=
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  if [[ -n "$server_stderr" ]]; then rm -f "$server_stderr"; fi
  docker rm --force --volumes "$container" >/dev/null
}
trap cleanup EXIT

db_address=$(docker port "$container" 5432/tcp)
DATABASE_URL="postgresql://postgres:$POSTGRES_PASSWORD@$db_address/seniorseat_ci"
unset POSTGRES_PASSWORD
for _ in {1..30}; do
  if docker exec "$container" pg_isready -q -h 127.0.0.1 -U postgres -d seniorseat_ci; then break; fi
  sleep 1
done
docker exec "$container" pg_isready -h 127.0.0.1 -U postgres -d seniorseat_ci

# Ask the OS for a free loopback port so local or concurrent runs can coexist.
port=$(node -e '
  const server = require("node:net").createServer();
  server.listen(0, "127.0.0.1", () => {
    console.log(server.address().port);
    server.close();
  });
')
BASE_URL="http://127.0.0.1:$port"
NEXT_PUBLIC_SITE_URL="$BASE_URL"
server_stderr=$(mktemp)
node_modules/.bin/next start -H 127.0.0.1 -p "$port" 2>"$server_stderr" &
server_pid=$!
for _ in {1..30}; do
  kill -0 "$server_pid"
  if status=$(curl --silent --max-time 3 --output /dev/null --write-out '%{http_code}' "$BASE_URL/api/health"); then break; fi
  sleep 1
done
if [[ "$status" != 503 ]]; then
  echo "Expected HTTP 503 before migration, received $status." >&2
  exit 1
fi

# Exercise the framework's render-error hook on the same unmigrated database.
curl --silent --show-error --max-time 15 --output /dev/null "$BASE_URL/x/SmokeShareCheck42?note=smoke-query-marker"
if ! grep -F '"event":"api_failure"' "$server_stderr" | grep -F '"code":"not_ready"' >/dev/null ||
   ! grep -F '"event":"server_request_failure"' "$server_stderr" | grep -F '"area":"x"' >/dev/null; then
  echo "Expected readiness and shared-page failure records in server stderr." >&2
  exit 1
fi
if grep -F -e 'SmokeShareCheck42' -e 'smoke-query-marker' "$server_stderr" >/dev/null; then
  echo "Server stderr included part of the synthetic visitor URL." >&2
  exit 1
fi
echo "Readiness and shared-page failures produced records without the synthetic URL."

pnpm db:migrate
pnpm smoke
signup_ids() {
  docker exec "$container" psql -XAt -v ON_ERROR_STOP=1 -U postgres -d seniorseat_ci \
    -c 'select id from waitlist_entries order by id'
}
before=$(signup_ids)
pnpm db:migrate
after=$(signup_ids)
if [[ -z "$before" || "$before" != "$after" ]]; then
  echo "Expected the smoke-test signup to survive a repeated migration." >&2
  exit 1
fi
echo "PostgreSQL readiness, migrations and signup persistence passed."

# Rehearse a verified request, keeping the earlier smoke signup as the unaffected control.
started=$SECONDS
curl --fail --silent --show-error --output /dev/null -H 'Content-Type: application/json' \
  --data '{"email":"deletion-rehearsal@example.com","consent":true}' "$BASE_URL/api/waitlist"
docker cp scripts/delete-waitlist-entry.sql "$container:/tmp/delete-waitlist-entry.sql"
delete_fixture() {
  printf '%s\n' ' Deletion-Rehearsal@Example.COM ' | docker exec -i "$container" \
    psql -XAtq -U postgres -d seniorseat_ci -f /tmp/delete-waitlist-entry.sql
}
audit_count() {
  docker exec "$container" psql -XAt -U postgres -d seniorseat_ci -c \
    "select count(*) from events where name = 'waitlist_deleted'
     and props = '{}'::jsonb and created_at = date_trunc('day', created_at, 'UTC')"
}
date_deleted=$(delete_fixture)
if [[ ! "$date_deleted" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Expected one UTC date from the deletion rehearsal, received '$date_deleted'." >&2
  exit 1
fi
if [[ "$(signup_ids)" != "$before" || "$(audit_count)" != 1 ]]; then
  echo "Expected the control signup and one date-only deletion event." >&2
  exit 1
fi
retry_date=$(delete_fixture)
if [[ -n "$retry_date" || "$(audit_count)" != 1 ]]; then
  echo "Repeating the deletion should leave the audit count unchanged." >&2
  exit 1
fi
echo "Verified waitlist deletion, date-only audit and retry in $((SECONDS - started)) seconds."
