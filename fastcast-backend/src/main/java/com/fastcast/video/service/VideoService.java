package com.fastcast.video.service;

import com.fastcast.cache.CacheService;
import com.fastcast.common.exception.ResourceNotFoundException;
import com.fastcast.metrics.service.LatencyMetricsService;
import com.fastcast.video.dto.VideoDto;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.mapper.VideoMapper;
import com.fastcast.video.repository.VideoRepository;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final VideoMapper videoMapper;
    private final CacheService cacheService;
    private final LatencyMetricsService latencyMetrics;

    private static final String VIDEO_KEY_PREFIX    = "video:";
    private static final String VIDEO_LIST_KEY      = "video:list:all";
    private static final String VIDEO_STATUS_PREFIX = "video:status:";
    private static final Duration VIDEO_TTL         = Duration.ofHours(1);
    private static final Duration LIST_TTL          = Duration.ofMinutes(5);
    private static final Duration STATUS_TTL        = Duration.ofSeconds(30);

    @Transactional(readOnly = true)
    public VideoDto getVideoById(UUID id) {
        String cacheKey = VIDEO_KEY_PREFIX + id;
        Timer.Sample sample = latencyMetrics.startSample();

        // 1. Try cache first
        var cached = cacheService.get(cacheKey);
        if (cached.isPresent()) {
            log.debug("Cache HIT for video: {}", id);
            latencyMetrics.stopSampleAs(sample, true);
            return (VideoDto) cached.get();
        }

        // 2. Cache miss — fetch from DB
        log.debug("Cache MISS for video: {} — fetching from DB", id);
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video", id.toString()));
        VideoDto dto = videoMapper.toDto(video);

        // 3. Store in cache
        cacheService.set(cacheKey, dto, VIDEO_TTL);
        latencyMetrics.stopSampleAs(sample, false);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<VideoDto> getAllVideos() {
        Timer.Sample sample = latencyMetrics.startSample();

        var cached = cacheService.get(VIDEO_LIST_KEY);
        if (cached.isPresent()) {
            log.debug("Cache HIT for video list");
            latencyMetrics.stopSampleAs(sample, true);
            return (List<VideoDto>) cached.get();
        }

        log.debug("Cache MISS for video list — fetching from DB");
        List<VideoDto> videos = videoRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(videoMapper::toDto)
                .collect(Collectors.toList());

        cacheService.set(VIDEO_LIST_KEY, videos, LIST_TTL);
        latencyMetrics.stopSampleAs(sample, false);
        return videos;
    }

    @Transactional(readOnly = true)
    public List<VideoDto> getVideosByStatus(VideoStatus status) {
        String cacheKey = "video:list:status:" + status;
        Timer.Sample sample = latencyMetrics.startSample();

        var cached = cacheService.get(cacheKey);
        if (cached.isPresent()) {
            latencyMetrics.stopSampleAs(sample, true);
            return (List<VideoDto>) cached.get();
        }

        List<VideoDto> videos = videoRepository
                .findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(videoMapper::toDto)
                .collect(Collectors.toList());
        cacheService.set(cacheKey, videos, LIST_TTL);
        latencyMetrics.stopSampleAs(sample, false);
        return videos;
    }

    @Transactional(readOnly = true)
    public VideoStatus getVideoStatus(UUID id) {
        String cacheKey = VIDEO_STATUS_PREFIX + id;
        Timer.Sample sample = latencyMetrics.startSample();

        var cached = cacheService.get(cacheKey);
        if (cached.isPresent()) {
            latencyMetrics.stopSampleAs(sample, true);
            return VideoStatus.valueOf(cached.get().toString());
        }

        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video", id.toString()));
        cacheService.set(cacheKey, video.getStatus().name(), STATUS_TTL);
        latencyMetrics.stopSampleAs(sample, false);
        return video.getStatus();
    }

    public void invalidateVideoCache(UUID id) {
        cacheService.evict(VIDEO_KEY_PREFIX + id);
        cacheService.evict(VIDEO_STATUS_PREFIX + id);
        cacheService.evict(VIDEO_LIST_KEY);
        cacheService.evictPattern("video:list:status:*");
        log.info("Cache invalidated for videoId: {}", id);
    }
}
