CREATE INDEX broadcasts_viewers_id_idx ON broadcasts(viewer_count DESC, id ASC);
CREATE INDEX broadcasts_title_id_idx ON broadcasts(title COLLATE "C" ASC, id ASC);
CREATE INDEX favorites_broadcast_idx ON favorites(broadcast_id);
