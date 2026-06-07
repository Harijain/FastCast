-- V4: Download tracking table
-- Records every time a user requests a download URL for a video.
-- Useful for analytics, abuse detection, and download history.

CREATE TABLE IF NOT EXISTS video_downloads (
                                               id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id        UUID        NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    quality         VARCHAR(20) NOT NULL,    -- 'original' | '720p' | '480p' | '240p'
    downloaded_at   TIMESTAMP   NOT NULL DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_downloads_user    ON video_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_video   ON video_downloads(video_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_at ON video_downloads(user_id, downloaded_at DESC);
