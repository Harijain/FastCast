package com.fastcast.watchhistory.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class WatchHistoryDto {
    private UUID id;
    private UUID userId;
    private UUID videoId;
    private String videoTitle;
    private String thumbnailUrl;
    private Integer progressSeconds;
    private Long durationSeconds;
    private Boolean completed;
    private Integer progressPercent;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime watchedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime updatedAt;

    // Alias for frontend compatibility
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime lastWatchedAt;
}