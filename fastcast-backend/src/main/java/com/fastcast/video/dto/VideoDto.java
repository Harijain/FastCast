package com.fastcast.video.dto;

import com.fastcast.video.enums.Genre;
import com.fastcast.video.enums.VideoStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
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
    private Long sizeBytes;
    private String originalFilename;

    // Uploader info
    private UUID uploaderId;
    private String uploaderName;

    // Engagement
    private Long views;

    // HLS qualities available for this video
    private List<String> qualities;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime updatedAt;
}