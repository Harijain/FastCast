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
import java.util.Arrays;
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

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "video/mp4", "video/x-matroska", "video/avi",
            "video/quicktime", "video/x-msvideo"
    );
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
        log.info("Created video record: {}", videoId);

        // Measure S3 upload latency
        long uploadStart = System.nanoTime();
        String s3Key = s3StorageService.uploadRawVideo(file, videoId);
        latencyMetrics.recordUploadLatency(System.nanoTime() - uploadStart);

        video.setS3RawKey(s3Key);
        video.setStatus(VideoStatus.PROCESSING);
        videoRepository.save(video);

        kafkaProducer.sendVideoProcessingJob(videoId, s3Key, video.getTitle());
        log.info("Kafka processing job dispatched for videoId: {}", videoId);

        return VideoUploadResponse.builder()
                .videoId(videoId)
                .title(video.getTitle())
                .status(video.getStatus())
                .message("Video uploaded successfully. Processing will begin shortly.")
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File cannot be empty");
        if (!ALLOWED_TYPES.contains(file.getContentType()))
            throw new IllegalArgumentException("Invalid file type. Allowed: mp4, mkv, avi, mov");
        if (file.getSize() > MAX_FILE_SIZE)
            throw new IllegalArgumentException("File size exceeds 2GB limit");
    }
}
