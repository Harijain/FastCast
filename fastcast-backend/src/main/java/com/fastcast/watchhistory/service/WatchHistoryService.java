package com.fastcast.watchhistory.service;

import com.fastcast.common.exception.ResourceNotFoundException;
import com.fastcast.video.entity.Video;
import com.fastcast.video.repository.VideoRepository;
import com.fastcast.watchhistory.dto.UpdateProgressRequest;
import com.fastcast.watchhistory.dto.WatchHistoryDto;
import com.fastcast.watchhistory.entity.WatchHistory;
import com.fastcast.watchhistory.repository.WatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatchHistoryService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final VideoRepository videoRepository;

    @Transactional
    public WatchHistoryDto updateProgress(UUID userId, UpdateProgressRequest request) {
        UUID videoId = request.getVideoId();

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video", videoId.toString()));

        WatchHistory history = watchHistoryRepository
                .findByUserIdAndVideoId(userId, videoId)
                .orElseGet(() -> WatchHistory.builder()
                        .userId(userId)
                        .videoId(videoId)
                        .build());

        history.setProgressSeconds(request.getProgressSeconds());
        history.setCompleted(request.isCompleted());
        history = watchHistoryRepository.save(history);

        log.debug("Updated watch progress for user: {}, video: {}, progress: {}s",
                userId, videoId, request.getProgressSeconds());

        return toDto(history, video);
    }

    @Transactional(readOnly = true)
    public List<WatchHistoryDto> getUserHistory(UUID userId) {
        return watchHistoryRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(h -> {
                    Video video = videoRepository.findById(h.getVideoId()).orElse(null);
                    return toDto(h, video);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WatchHistoryDto getProgress(UUID userId, UUID videoId) {
        WatchHistory history = watchHistoryRepository
                .findByUserIdAndVideoId(userId, videoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Watch history not found for video: " + videoId));
        Video video = videoRepository.findById(videoId).orElse(null);
        return toDto(history, video);
    }

    private WatchHistoryDto toDto(WatchHistory h, Video video) {
        int progressPercent = 0;
        Long duration = null;
        String title = null;
        String thumbnailUrl = null;

        if (video != null) {
            title = video.getTitle();
            duration = video.getDurationSeconds();
            thumbnailUrl = video.getThumbnailUrl();
            if (duration != null && duration > 0) {
                progressPercent = (int) Math.min(100,
                        Math.round((h.getProgressSeconds() * 100.0) / duration));
            }
        }

        return WatchHistoryDto.builder()
                .id(h.getId())
                .userId(h.getUserId())
                .videoId(h.getVideoId())
                .videoTitle(title)
                .thumbnailUrl(thumbnailUrl)
                .progressSeconds(h.getProgressSeconds())
                .durationSeconds(duration)
                .completed(h.getCompleted())
                .progressPercent(progressPercent)
                .watchedAt(h.getWatchedAt())
                .updatedAt(h.getUpdatedAt())
                .lastWatchedAt(h.getUpdatedAt())
                .build();
    }
}