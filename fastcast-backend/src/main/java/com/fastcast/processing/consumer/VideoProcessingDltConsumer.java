package com.fastcast.processing.consumer;

import com.fastcast.config.KafkaConfig;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.repository.VideoRepository;
import com.fastcast.video.service.VideoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Listens to the dead-letter topic for jobs that exhausted all retries
 * during HLS processing. Marks the corresponding video as FAILED so
 * users don't see it stuck in PROCESSING forever, and the failure is
 * visible via /api/v1/videos/by-status?status=FAILED.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VideoProcessingDltConsumer {

    private final VideoRepository videoRepository;
    private final VideoService videoService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = KafkaConfig.VIDEO_PROCESSING_DLT,
            groupId = "fastcast-dlt-group"
    )
    public void handleFailedProcessing(
            @Payload String rawPayload,
            @Header(KafkaHeaders.EXCEPTION_MESSAGE) String exceptionMessage) {

        log.error("Received DLT message — payload: {}, exception: {}",
                rawPayload, exceptionMessage);

        UUID videoId = extractVideoId(rawPayload);
        if (videoId == null) {
            log.error("Could not extract videoId from DLT payload, cannot mark FAILED");
            return;
        }

        videoRepository.findById(videoId).ifPresentOrElse(video -> {
            video.setStatus(VideoStatus.FAILED);
            video.setErrorMessage("Processing failed after retries: " + exceptionMessage);
            videoRepository.save(video);
            videoService.invalidateVideoCache(videoId);
            log.info("Marked videoId {} as FAILED after DLT routing", videoId);
        }, () -> log.error("Video {} not found while handling DLT message", videoId));
    }

    /**
     * The original VideoProcessingEvent is JSON-serialized by Spring Kafka's
     * JsonSerializer, so even after a deserialization failure the raw bytes
     * usually still contain the videoId field. We parse it defensively.
     */
    private UUID extractVideoId(String rawPayload) {
        try {
            var node = objectMapper.readTree(rawPayload);
            String idStr = node.has("videoId") ? node.get("videoId").asText() : null;
            return idStr != null ? UUID.fromString(idStr) : null;
        } catch (Exception e) {
            log.warn("Failed to parse DLT payload as JSON: {}", e.getMessage());
            return null;
        }
    }
}