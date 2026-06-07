-- Add catalog fields to existing videos table
ALTER TABLE videos
    ADD COLUMN IF NOT EXISTS genre        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS is_public    BOOLEAN DEFAULT TRUE;

-- Create index for genre browsing
CREATE INDEX IF NOT EXISTS idx_videos_genre ON videos(genre);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);