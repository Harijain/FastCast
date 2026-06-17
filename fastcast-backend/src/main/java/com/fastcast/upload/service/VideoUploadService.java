package com.fastcast.upload.service;

import com.fastcast.metrics.service.LatencyMetricsService;
import com.fastcast.processing.producer.VideoProcessingProducer;
import com.fastcast.upload.dto.VideoUploadRequest;
import com.fastcast.upload.dto.VideoUploadResponse;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoUploadService {

    private final VideoRepository videoRepository;
    private final S3StorageService s3StorageService;
    private final VideoProcessingProducer kafkaProducer;
    private final LatencyMetricsService latencyMetrics;

    private static final List<String> ALLOWED_TYPES = List.of(
            "video/mp4",
            "video/x-matroska",
            "video/avi",
            "video/quicktime",
            "video/x-msvideo");

    private static final long MAX_FILE_SIZE = 2L * 1024 * 1024 * 1024;

    @Transactional
    public VideoUploadResponse uploadVideo(
            MultipartFile file,
            VideoUploadRequest request) throws IOException {

        validateFile(file);

        Video video = Video.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .originalFilename(file.getOriginalFilename())
                .fileSizeBytes(file.getSize())
                .status(VideoStatus.UPLOADED)
                .build();

        video = videoRepository.save(video);

        UUID videoId = video.getId();

        log.info(
                "Video upload initiated videoId={}",
                videoId);

        String s3Key = null;

        try {

            long start = System.nanoTime();

            s3Key = s3StorageService.uploadRawVideo(
                    file,
                    videoId);

            latencyMetrics.recordUploadLatency(
                    System.nanoTime() - start);

            video.setS3RawKey(s3Key);
            video.setStatus(VideoStatus.PROCESSING);

            videoRepository.save(video);

            kafkaProducer.sendVideoProcessingJob(
                    videoId,
                    s3Key,
                    video.getTitle());

            log.info(
                    "Kafka processing event published videoId={}",
                    videoId);

            return VideoUploadResponse.builder()
                    .videoId(videoId)
                    .title(video.getTitle())
                    .status(video.getStatus())
                    .message(
                            "Upload successful. Video processing started.")
                    .build();

        } catch (Exception ex) {

            log.error(
                    "Upload failed videoId={}",
                    videoId,
                    ex);

            if (s3Key != null) {

                try {

                    s3StorageService.deleteObject(
                            s3Key);

                    log.info(
                            "Rolled back S3 object {}",
                            s3Key);

                } catch (Exception cleanupEx) {

                    log.error(
                            "S3 cleanup failed {}",
                            s3Key,
                            cleanupEx);

                }

            }

            throw ex;
        }

    }

    private void validateFile(
            MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "File cannot be empty");

        }

        if (!ALLOWED_TYPES.contains(
                file.getContentType())) {

            throw new IllegalArgumentException(
                    "Unsupported video format");

        }

        if (file.getSize() > MAX_FILE_SIZE) {

            throw new IllegalArgumentException(
                    "Maximum upload size is 2GB");

        }

    }

}