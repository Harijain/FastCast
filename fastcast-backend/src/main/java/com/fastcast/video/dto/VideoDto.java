package com.fastcast.video.dto;

import com.fastcast.video.enums.Genre;
import com.fastcast.video.enums.VideoStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoDto {
    private UUID id;
    private String title;
    private String description;
    private VideoStatus status;
    private Genre genre;
    private String thumbnailUrl;
    private Boolean isPublic;
    private Long durationSeconds;
    private Long fileSizeBytes;
    private String originalFilename;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
