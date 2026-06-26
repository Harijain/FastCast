package com.fastcast.video.mapper;

import com.fastcast.video.dto.VideoDto;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class VideoMapper {

    public VideoDto toDto(Video video) {
        List<String> qualities = VideoStatus.READY.equals(video.getStatus())
                ? List.of("720p", "480p", "240p")
                : List.of();

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
                .sizeBytes(video.getFileSizeBytes())
                .originalFilename(video.getOriginalFilename())
                .uploaderId(null)
                .uploaderName("FastCast")
                .views(0L)
                .qualities(qualities)
                .createdAt(video.getCreatedAt())
                .updatedAt(video.getUpdatedAt())
                .build();
    }
}