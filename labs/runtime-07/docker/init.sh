#!/bin/sh
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v app_password="$(cat /run/secrets/db_password)" <<'SQL'
CREATE ROLE runtime05_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'app_password';
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO runtime05_app;
GRANT SELECT,INSERT ON users TO runtime05_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON sessions TO runtime05_app;
GRANT SELECT,INSERT,UPDATE ON notification_accounts,notification_events,notifications TO runtime05_app;
SQL
