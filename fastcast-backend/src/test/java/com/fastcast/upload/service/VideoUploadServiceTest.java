package com.fastcast.upload.service;

import com.fastcast.metrics.service.LatencyMetricsService;
import com.fastcast.processing.producer.VideoProcessingProducer;
import com.fastcast.upload.dto.VideoUploadRequest;
import com.fastcast.upload.dto.VideoUploadResponse;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VideoUploadService unit tests")
class VideoUploadServiceTest {

    @Mock private VideoRepository videoRepository;
    @Mock private S3StorageService s3StorageService;
    @Mock private VideoProcessingProducer kafkaProducer;
    @Mock private LatencyMetricsService latencyMetrics;

    @InjectMocks
    private VideoUploadService videoUploadService;

    private MockMultipartFile validFile;
    private VideoUploadRequest uploadRequest;

    @BeforeEach
    void setUp() {
        validFile = new MockMultipartFile(
                "file",
                "test-video.mp4",
                "video/mp4",
                new byte[1024]   // 1KB dummy content
        );

        uploadRequest = new VideoUploadRequest();
        uploadRequest.setTitle("My Test Video");
        uploadRequest.setDescription("Test description");
    }

    @Test
    @DisplayName("uploadVideo — saves video, uploads to S3, publishes Kafka event")
    void uploadVideo_success_savesAndPublishesKafkaEvent() throws Exception {
        UUID videoId = UUID.randomUUID();
        String s3Key = "raw/" + videoId + "/original.mp4";

        Video savedVideo = Video.builder()
                .id(videoId)
                .title("My Test Video")
                .status(VideoStatus.PROCESSING)
                .s3RawKey(s3Key)
                .build();

        when(videoRepository.save(any(Video.class))).thenReturn(savedVideo);
        when(s3StorageService.uploadRawVideo(any(), any())).thenReturn(s3Key);

        VideoUploadResponse response =
                videoUploadService.uploadVideo(validFile, uploadRequest);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(VideoStatus.PROCESSING);

        // Kafka MUST be called after successful S3 upload
        verify(kafkaProducer).sendVideoProcessingJob(any(), eq(s3Key), any());
        verify(latencyMetrics).recordUploadLatency(anyLong());
    }

    @Test
    @DisplayName("uploadVideo — rejects unsupported file type")
    void uploadVideo_invalidContentType_throwsException() throws IOException {
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                new byte[100]
        );

        assertThatThrownBy(() ->
                videoUploadService.uploadVideo(invalidFile, uploadRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported video format");

        // Nothing should be saved or uploaded
        verify(videoRepository, never()).save(any());
        verify(s3StorageService, never()).uploadRawVideo(any(), any());
    }

    @Test
    @DisplayName("uploadVideo — rejects empty file")
    void uploadVideo_emptyFile_throwsException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.mp4", "video/mp4", new byte[0]
        );

        assertThatThrownBy(() ->
                videoUploadService.uploadVideo(emptyFile, uploadRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("empty");
    }

    @Test
    @DisplayName("uploadVideo — rolls back S3 object when Kafka publish fails")
    void uploadVideo_kafkaFails_rollsBackS3() throws Exception {
        UUID videoId = UUID.randomUUID();
        String s3Key = "raw/" + videoId + "/original.mp4";

        Video savedVideo = Video.builder()
                .id(videoId)
                .title("My Test Video")
                .status(VideoStatus.PROCESSING)
                .s3RawKey(s3Key)
                .build();

        when(videoRepository.save(any(Video.class))).thenReturn(savedVideo);
        when(s3StorageService.uploadRawVideo(any(), any())).thenReturn(s3Key);
        doThrow(new RuntimeException("Kafka broker unavailable"))
                .when(kafkaProducer).sendVideoProcessingJob(any(), any(), any());

        assertThatThrownBy(() ->
                videoUploadService.uploadVideo(validFile, uploadRequest))
                .isInstanceOf(RuntimeException.class);

        // S3 cleanup must be attempted
        verify(s3StorageService).deleteObject(s3Key);
    }
}