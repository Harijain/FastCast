package com.fastcast.watchhistory.dto;

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
    private Integer progressSeconds;
    private Long durationSeconds;
    private Boolean completed;
    private Integer progressPercent;
    private LocalDateTime watchedAt;
    private LocalDateTime updatedAt;
}
