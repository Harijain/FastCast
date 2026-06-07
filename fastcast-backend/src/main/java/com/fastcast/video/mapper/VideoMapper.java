package com.fastcast.video.mapper;

import com.fastcast.video.dto.VideoDto;
import com.fastcast.video.entity.Video;
import org.springframework.stereotype.Component;

@Component
public class VideoMapper {

    public VideoDto toDto(Video video) {
        return VideoDto.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .status(video.getStatus())
                .genre(video.getGenre())
                .thumbnailUrl(video.getThumbnailUrl())
                .isPublic(video.getIsPublic())
                .durationSeconds(video.getDurationSeconds())
                .fileSizeBytes(video.getFileSizeBytes())
                .originalFilename(video.getOriginalFilename())
                .createdAt(video.getCreatedAt())
                .updatedAt(video.getUpdatedAt())
                .build();
    }
}
