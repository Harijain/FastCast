package com.fastcast.download.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class DownloadHistoryDto {

    private UUID id;

    private UUID videoId;

    private String videoTitle;

    private String thumbnailUrl;

    private Long fileSizeBytes;

    private String quality;

    private LocalDateTime downloadedAt;
}