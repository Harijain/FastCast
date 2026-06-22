-- Ensure watch_history cascades when a video is deleted
ALTER TABLE watch_history
DROP CONSTRAINT IF EXISTS watch_history_video_id_fkey,
    ADD CONSTRAINT watch_history_video_id_fkey
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

-- Ensure video_downloads cascades when a video is deleted
ALTER TABLE video_downloads
DROP CONSTRAINT IF EXISTS video_downloads_video_id_fkey,
    ADD CONSTRAINT video_downloads_video_id_fkey
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;