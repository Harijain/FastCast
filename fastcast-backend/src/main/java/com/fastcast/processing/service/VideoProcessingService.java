package com.fastcast.processing.service;

import com.fastcast.config.properties.AwsProperties;
import com.fastcast.metrics.service.LatencyMetricsService;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.repository.VideoRepository;
import com.fastcast.video.service.VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoProcessingService {

    private final VideoRepository videoRepository;
    private final FFmpegService ffmpegService;
    private final HlsUploadService hlsUploadService;
    private final S3Client s3Client;
    private final AwsProperties awsProperties;
    private final VideoService videoService;
    private final LatencyMetricsService latencyMetrics;

    public void processVideo(UUID videoId, String s3RawKey) {
        log.info("Starting processing for videoId: {}", videoId);
        long processingStart = System.nanoTime();
        Path tempInput = null;
        Path hlsOutputDir = null;

        try {
            // 1. Download raw video from S3
            tempInput = downloadFromS3(videoId, s3RawKey);
            log.info("Downloaded raw video to: {}", tempInput);

            // 2. Get video duration
            long duration = ffmpegService.getVideoDuration(tempInput);
            log.info("Video duration: {} seconds", duration);

            // 3. FFmpeg → HLS conversion
            hlsOutputDir = ffmpegService.convertToHls(tempInput, videoId);

            // 4. Upload HLS chunks to S3
            String s3HlsPath = hlsUploadService.uploadHlsToS3(hlsOutputDir, videoId);

            // 5. Update DB → READY
            updateVideoStatus(videoId, VideoStatus.READY, s3HlsPath, duration, null);
            log.info("Video {} is now READY", videoId);

            // 6. Record total processing latency
            latencyMetrics.recordProcessingLatency(System.nanoTime() - processingStart);

        } catch (Exception e) {
            log.error("Processing failed for videoId: {}", videoId, e);
            updateVideoStatus(videoId, VideoStatus.FAILED, null, 0L, e.getMessage());

        } finally {
            cleanup(tempInput, hlsOutputDir, videoId);
        }
    }

    private Path downloadFromS3(UUID videoId, String s3Key) throws IOException {
        Path tempDir = Paths.get(
                System.getProperty("java.io.tmpdir"),
                "fastcast", videoId.toString());
        Files.createDirectories(tempDir);

        String extension = s3Key.substring(s3Key.lastIndexOf("."));
        Path localFile = tempDir.resolve("input" + extension);

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(awsProperties.getS3().getBucketName())
                .key(s3Key)
                .build();

        try (ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(request)) {
            Files.copy(s3Object, localFile, StandardCopyOption.REPLACE_EXISTING);
        }

        return localFile;
    }

    private void updateVideoStatus(UUID videoId, VideoStatus status,
                                   String hlsPath, Long duration, String error) {
        videoRepository.findById(videoId).ifPresent(video -> {
            video.setStatus(status);
            if (hlsPath != null) video.setS3HlsBasePath(hlsPath);
            if (duration > 0)    video.setDurationSeconds(duration);
            if (error != null)   video.setErrorMessage(error);
            videoRepository.save(video);
            if (status == VideoStatus.READY || status == VideoStatus.FAILED) {
                videoService.invalidateVideoCache(videoId);
            }
        });
    }

    private void cleanup(Path tempInput, Path hlsOutputDir, UUID videoId) {
        try {
            if (tempInput != null && Files.exists(tempInput)) {
                Files.deleteIfExists(tempInput);
                log.debug("Cleaned up temp input: {}", tempInput);
            }
            if (hlsOutputDir != null && Files.exists(hlsOutputDir)) {
                deleteDirectory(hlsOutputDir);
                log.debug("Cleaned up HLS output dir: {}", hlsOutputDir);
            }
        } catch (Exception e) {
            log.warn("Cleanup failed for videoId: {}", videoId, e);
        }
    }

    private void deleteDirectory(Path dir) throws IOException {
        Files.walk(dir)
                .sorted(java.util.Comparator.reverseOrder())
                .forEach(path -> {
                    try { Files.deleteIfExists(path); }
                    catch (IOException e) { log.warn("Could not delete: {}", path); }
                });
    }
}
