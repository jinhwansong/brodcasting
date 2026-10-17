CREATE TABLE demo_users (id text PRIMARY KEY);
CREATE TABLE broadcasts (
  id text PRIMARY KEY, title text NOT NULL, host_name text NOT NULL,
  viewer_count integer NOT NULL CHECK (viewer_count >= 0), description text NOT NULL
);
CREATE TABLE favorites (
  user_id text NOT NULL REFERENCES demo_users(id),
  broadcast_id text NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, broadcast_id)
);
