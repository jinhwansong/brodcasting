CREATE TABLE users(id uuid,username text,password_hash text);
CREATE TABLE broadcasts(id text,title text,host_name text,viewer_count integer,description text);
CREATE TABLE favorites(user_id uuid,broadcast_id text);
CREATE TABLE rooms(id text,title text,notice text);
CREATE TABLE room_admins(user_id uuid,room_id text);
CREATE TABLE sessions(sid varchar,sess json,expire timestamp(6));
