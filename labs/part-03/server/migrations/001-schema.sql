-- 과제 A: viewer_count CHECK, favorites의 NOT NULL·복합 PK·FK·CASCADE를 채우세요.
CREATE TABLE demo_users (id text PRIMARY KEY);
CREATE TABLE broadcasts (
  id text PRIMARY KEY, title text NOT NULL, host_name text NOT NULL,
  viewer_count integer NOT NULL, description text NOT NULL
);
CREATE TABLE favorites (user_id text, broadcast_id text);
