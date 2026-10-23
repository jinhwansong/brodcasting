CREATE TABLE users(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 username text UNIQUE NOT NULL CHECK(char_length(username) BETWEEN 3 AND 24 AND left(username,1)~'^[a-z]$' AND username!~'[^a-z0-9_]'),
 password_hash text NOT NULL CHECK(char_length(password_hash)>0)
);
CREATE TABLE sessions(sid varchar PRIMARY KEY,sess json NOT NULL,expire timestamp(6) NOT NULL);
CREATE INDEX sessions_expire_idx ON sessions(expire);
CREATE TABLE notification_accounts(
 user_id uuid PRIMARY KEY REFERENCES users(id),created_count integer NOT NULL DEFAULT 0 CHECK(created_count BETWEEN 0 AND 100),
 inbox_seq bigint NOT NULL DEFAULT 0 CHECK(inbox_seq>=0)
);
CREATE TABLE notification_events(
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),client_key uuid NOT NULL,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 500 AND body~'[^[:space:]]'),
 queued_at timestamptz,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(user_id,client_key)
);
CREATE TABLE notifications(
 id uuid PRIMARY KEY REFERENCES notification_events(id),user_id uuid NOT NULL REFERENCES users(id),
 seq bigint NOT NULL CHECK(seq>0),body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),read_at timestamptz,UNIQUE(user_id,seq)
);
CREATE INDEX notification_events_owner_idx ON notification_events(user_id,created_at,id);
