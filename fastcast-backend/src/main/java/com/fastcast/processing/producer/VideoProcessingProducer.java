package com.fastcast.processing.producer;

import com.fastcast.config.KafkaConfig;
import com.fastcast.processing.event.VideoProcessingEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoProcessingProducer {

    private final KafkaTemplate<String, VideoProcessingEvent> kafkaTemplate;

    public void sendVideoProcessingJob(UUID videoId, String s3RawKey, String title) {
        VideoProcessingEvent event = VideoProcessingEvent.builder()
                .videoId(videoId)
                .s3RawKey(s3RawKey)
                .title(title)
                .build();

        CompletableFuture<SendResult<String, VideoProcessingEvent>> future =
                kafkaTemplate.send(
                        KafkaConfig.VIDEO_PROCESSING_TOPIC,
                        videoId.toString(),
                        event
                );

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send processing job for videoId: {}", videoId, ex);
            } else {
                log.info("Processing job sent for videoId: {} → partition: {}, offset: {}",
                        videoId,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}