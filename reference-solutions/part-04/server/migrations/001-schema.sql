CREATE TABLE users(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 username text UNIQUE NOT NULL CHECK(char_length(username) BETWEEN 3 AND 24 AND left(username,1)~'^[a-z]$' AND username!~'[^a-z0-9_]'),
 password_hash text NOT NULL CHECK(char_length(password_hash)>0)
);
CREATE TABLE broadcasts(id text PRIMARY KEY,title text NOT NULL,host_name text NOT NULL,viewer_count integer NOT NULL CHECK(viewer_count>=0),description text NOT NULL);
CREATE TABLE favorites(
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 broadcast_id text NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,broadcast_id)
);
CREATE TABLE rooms(id text PRIMARY KEY,title text NOT NULL,notice text NOT NULL DEFAULT '' CHECK(char_length(notice)<=500));
CREATE TABLE room_admins(
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,room_id)
);
CREATE TABLE sessions(sid varchar PRIMARY KEY,sess json NOT NULL,expire timestamp(6) NOT NULL);
CREATE INDEX sessions_expire_idx ON sessions(expire);
CREATE INDEX broadcasts_viewers_idx ON broadcasts(viewer_count DESC,id ASC);
CREATE INDEX broadcasts_title_idx ON broadcasts(title COLLATE "C",id);
CREATE INDEX favorites_broadcast_idx ON favorites(broadcast_id);
CREATE INDEX room_admins_room_idx ON room_admins(room_id);
