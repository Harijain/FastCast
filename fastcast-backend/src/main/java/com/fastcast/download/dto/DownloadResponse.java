package com.fastcast.download.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class DownloadResponse {

    private UUID videoId;
    private String title;
    private String quality;

    /**
     * Pre-signed S3 URL — valid for presignedUrlExpiry minutes (configured in application.yml).
     * The client should start downloading immediately; the URL will expire.
     */
    private String downloadUrl;

    private long expiresInMinutes;
    private LocalDateTime generatedAt;
}
