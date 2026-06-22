CREATE TABLE IF NOT EXISTS videos (
                                      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    s3_raw_key          VARCHAR(500),
    s3_hls_base_path    VARCHAR(500),
    duration_seconds    BIGINT,
    file_size_bytes     BIGINT,
    original_filename   VARCHAR(255),
    status              VARCHAR(50)     NOT NULL DEFAULT 'UPLOADED',
    error_message       TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT now()
    );

CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);