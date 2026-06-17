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
import com.fastcast.video.dto.VideoSearchRequest;
import com.fastcast.video.specification.VideoSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoService {
    @Transactional(readOnly = true)
    public Page<VideoDto> searchVideos(VideoSearchRequest request) {

        Specification<Video> spec = Specification
                .where(VideoSpecification.titleContains(request.getSearch()))
                .and(VideoSpecification.hasGenre(request.getGenre()))
                .and(VideoSpecification.hasStatus(request.getStatus()))
                .and(VideoSpecification.isPublic(request.getIsPublic()));

        Sort.Direction direction = "ASC".equalsIgnoreCase(request.getDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(direction, request.getSortBy())
        );

        Page<Video> videoPage = videoRepository.findAll(spec, pageable);

        return videoPage.map(videoMapper::toDto);
    }

    private final VideoRepository videoRepository;
    private final VideoMapper videoMapper;
    private final CacheService cacheService;
    private final LatencyMetricsService latencyMetrics;

    private static final String VIDEO_KEY_PREFIX = "video:";
    private static final String VIDEO_LIST_KEY = "video:list:all";
    private static final String VIDEO_STATUS_PREFIX = "video:status:";

    private static final Duration VIDEO_TTL = Duration.ofHours(1);
    private static final Duration LIST_TTL = Duration.ofMinutes(5);
    private static final Duration STATUS_TTL = Duration.ofSeconds(30);

    @Transactional(readOnly = true)
    public VideoDto getVideoById(UUID id) {

        String cacheKey = VIDEO_KEY_PREFIX + id;
        Timer.Sample sample = latencyMetrics.startSample();

        var cached = cacheService.get(cacheKey);

        if (cached.isPresent()) {
            log.debug("Cache HIT for video {}", id);
            latencyMetrics.stopSampleAs(sample, true);
            return (VideoDto) cached.get();
        }

        log.debug("Cache MISS for video {}", id);

        Video video = videoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Video", id.toString()));

        VideoDto dto = videoMapper.toDto(video);

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

        log.debug("Cache MISS for video list");

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

        String cacheKey = VIDEO_STATUS_PREFIX + status;

        Timer.Sample sample = latencyMetrics.startSample();

        var cached = cacheService.get(cacheKey);

        if (cached.isPresent()) {
            log.debug("Cache HIT for status {}", status);
            latencyMetrics.stopSampleAs(sample, true);
            return (List<VideoDto>) cached.get();
        }

        log.debug("Cache MISS for status {}", status);

        List<VideoDto> videos = videoRepository
                .findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(videoMapper::toDto)
                .collect(Collectors.toList());

        cacheService.set(cacheKey, videos, STATUS_TTL);

        latencyMetrics.stopSampleAs(sample, false);

        return videos;
    }

    @Transactional(readOnly = true)
    public VideoStatus getVideoStatus(UUID id) {

        String cacheKey = VIDEO_STATUS_PREFIX + id;

        var cached = cacheService.get(cacheKey);

        if (cached.isPresent()) {
            return (VideoStatus) cached.get();
        }

        VideoStatus status = videoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Video", id.toString()))
                .getStatus();

        cacheService.set(cacheKey, status, STATUS_TTL);

        return status;
    }
    public void invalidateVideoCache(UUID id) {
        cacheService.evict(VIDEO_KEY_PREFIX + id);
        cacheService.evict(VIDEO_STATUS_PREFIX + id);
        cacheService.evict(VIDEO_LIST_KEY);
        log.info("Cache invalidated for videoId: {}", id);
    }
}