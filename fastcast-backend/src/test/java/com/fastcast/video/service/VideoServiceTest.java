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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VideoService unit tests")
class VideoServiceTest {

    @Mock private VideoRepository videoRepository;
    @Mock private VideoMapper videoMapper;
    @Mock private CacheService cacheService;
    @Mock private LatencyMetricsService latencyMetrics;
    @Mock private Timer.Sample timerSample;

    @InjectMocks
    private VideoService videoService;

    private UUID videoId;
    private Video video;
    private VideoDto videoDto;

    @BeforeEach
    void setUp() {
        videoId = UUID.randomUUID();

        video = Video.builder()
                .id(videoId)
                .title("Test Video")
                .description("Test Description")
                .status(VideoStatus.READY)
                .build();

        videoDto = VideoDto.builder()
                .id(videoId)
                .title("Test Video")
                .description("Test Description")
                .status(VideoStatus.READY)
                .build();

        // Timer.Sample mock — returned by latencyMetrics.startSample()
        when(latencyMetrics.startSample()).thenReturn(timerSample);
    }

    // ── Cache HIT tests ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getVideoById — returns cached value and skips DB when cache hits")
    void getVideoById_cacheHit_skipsDatabaseCall() {
        when(cacheService.get("video:" + videoId))
                .thenReturn(Optional.of(videoDto));

        VideoDto result = videoService.getVideoById(videoId);

        assertThat(result).isEqualTo(videoDto);
        // DB must NOT be called on cache hit
        verify(videoRepository, never()).findById(any());
        verify(latencyMetrics).stopSampleAs(timerSample, true);
    }

    @Test
    @DisplayName("getVideoById — hits DB and populates cache on cache miss")
    void getVideoById_cacheMiss_hitsDbAndPopulatesCache() {
        when(cacheService.get("video:" + videoId)).thenReturn(Optional.empty());
        when(videoRepository.findById(videoId)).thenReturn(Optional.of(video));
        when(videoMapper.toDto(video)).thenReturn(videoDto);

        VideoDto result = videoService.getVideoById(videoId);

        assertThat(result).isEqualTo(videoDto);
        verify(videoRepository).findById(videoId);
        verify(cacheService).set(eq("video:" + videoId), eq(videoDto), any());
        verify(latencyMetrics).stopSampleAs(timerSample, false);
    }

    @Test
    @DisplayName("getVideoById — throws ResourceNotFoundException when video not in DB or cache")
    void getVideoById_notFound_throwsException() {
        when(cacheService.get(anyString())).thenReturn(Optional.empty());
        when(videoRepository.findById(videoId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> videoService.getVideoById(videoId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(videoId.toString());
    }

    // ── getAllVideos tests ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllVideos — returns cached list without DB call")
    void getAllVideos_cacheHit_returnsCachedList() {
        List<VideoDto> cachedList = List.of(videoDto);
        when(cacheService.get("video:list:all")).thenReturn(Optional.of(cachedList));

        List<VideoDto> result = videoService.getAllVideos();

        assertThat(result).hasSize(1).containsExactly(videoDto);
        verify(videoRepository, never()).findAllByOrderByCreatedAtDesc();
    }

    @Test
    @DisplayName("getAllVideos — fetches from DB and caches on miss")
    void getAllVideos_cacheMiss_fetchesAndCaches() {
        when(cacheService.get("video:list:all")).thenReturn(Optional.empty());
        when(videoRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(video));
        when(videoMapper.toDto(video)).thenReturn(videoDto);

        List<VideoDto> result = videoService.getAllVideos();

        assertThat(result).hasSize(1);
        verify(cacheService).set(eq("video:list:all"), anyList(), any());
    }

    // ── Cache invalidation tests ──────────────────────────────────────────────

    @Test
    @DisplayName("invalidateVideoCache — evicts all related cache keys")
    void invalidateVideoCache_evictsAllKeys() {
        videoService.invalidateVideoCache(videoId);

        verify(cacheService).evict("video:" + videoId);
        verify(cacheService).evict("video:status:" + videoId);
        verify(cacheService).evict("video:list:all");
    }

    // ── getVideoStatus tests ──────────────────────────────────────────────────

    @Test
    @DisplayName("getVideoStatus — returns cached status without DB call")
    void getVideoStatus_cacheHit_returnsStatus() {
        when(cacheService.get("video:status:" + videoId))
                .thenReturn(Optional.of(VideoStatus.READY));

        VideoStatus status = videoService.getVideoStatus(videoId);

        assertThat(status).isEqualTo(VideoStatus.READY);
        verify(videoRepository, never()).findById(any());
    }
}