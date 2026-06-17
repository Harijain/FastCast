package com.fastcast.video.mapper;

import com.fastcast.video.dto.VideoDto;
import com.fastcast.video.entity.Video;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class VideoMapper {

    /**
     * Converts Video Entity into Video DTO.
     *
     * @param video Video entity
     * @return VideoDto
     */
    public VideoDto toDto(Video video) {

        if (video == null) {
            log.warn("Attempted to map a null Video entity.");
            return null;
        }

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