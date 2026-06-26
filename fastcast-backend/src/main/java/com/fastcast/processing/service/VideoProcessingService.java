package com.fastcast.processing.service;

import com.fastcast.config.properties.AwsProperties;
import com.fastcast.metrics.service.LatencyMetricsService;
import com.fastcast.upload.service.S3StorageService;
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
import java.nio.file.*;
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
    private final S3StorageService s3StorageService;

    public void processVideo(UUID videoId, String s3RawKey) {

        log.info("Starting processing for video {}", videoId);

        long processingStart = System.nanoTime();

        Path tempInput = null;
        Path thumbnail = null;
        Path hlsOutputDir = null;

        try {

            tempInput = downloadFromS3(videoId, s3RawKey);

            long duration = ffmpegService.getVideoDuration(tempInput);

            thumbnail = ffmpegService.generateThumbnail(
                    tempInput,
                    videoId);
            log.info("Thumbnail generated at: {}", thumbnail);
            log.info("Thumbnail exists: {}", Files.exists(thumbnail));

            hlsOutputDir = ffmpegService.convertToHls(
                    tempInput,
                    videoId);

            String s3HlsPath = hlsUploadService.uploadHlsToS3(
                    hlsOutputDir,
                    videoId);
            String thumbnailUrl = s3StorageService.uploadThumbnail(
                    thumbnail,
                    videoId);
            log.info("Thumbnail uploaded URL: {}", thumbnailUrl);

            updateVideoStatus(
                    videoId,
                    VideoStatus.READY,
                    s3HlsPath,
                    thumbnailUrl,
                    duration,
                    null);

            latencyMetrics.recordProcessingLatency(
                    System.nanoTime() - processingStart);

            log.info("Video {} processed successfully. Duration={}s", videoId, duration);

        } catch (Exception e) {

            log.error("Processing failed {}", videoId, e);

            updateVideoStatus(
                    videoId,
                    VideoStatus.FAILED,
                    null,
                    null,
                    0L,
                    e.getMessage());

        } finally {

            cleanup(
                    tempInput,
                    thumbnail,
                    hlsOutputDir,
                    videoId);
        }
    }

    private Path downloadFromS3(UUID videoId, String s3Key) throws IOException {

        Path tempDir = Paths.get(
                System.getProperty("java.io.tmpdir"),
                "fastcast",
                videoId.toString());

        Files.createDirectories(tempDir);

        String extension = s3Key.substring(s3Key.lastIndexOf("."));

        Path localFile = tempDir.resolve("input" + extension);

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(awsProperties.getS3().getBucketName())
                .key(s3Key)
                .build();

        try (ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(request)) {

            Files.copy(
                    s3Object,
                    localFile,
                    StandardCopyOption.REPLACE_EXISTING);
        }

        return localFile;
    }

    private void updateVideoStatus(
            UUID videoId,
            VideoStatus status,
            String hlsPath,
            String thumbnailUrl,
            Long duration,
            String error) {

        videoRepository.findById(videoId).ifPresent(video -> {

            video.setStatus(status);

            if (hlsPath != null) {
                video.setS3HlsBasePath(hlsPath);
            }

            if (thumbnailUrl != null) {
                video.setThumbnailUrl(thumbnailUrl);
            }

            if (duration > 0) {
                video.setDurationSeconds(duration);
            }

            if (error != null) {
                video.setErrorMessage(error);
            }
            log.info("Saving thumbnailUrl: {}", thumbnailUrl);
            videoRepository.save(video);
            log.info("Saved entity thumbnailUrl: {}", video.getThumbnailUrl());

            if (status == VideoStatus.READY ||
                    status == VideoStatus.FAILED) {

                videoService.invalidateVideoCache(videoId);
            }
        });
    }

    private void cleanup(
            Path tempInput,
            Path thumbnail,
            Path hlsOutputDir,
            UUID videoId) {

        try {

            if (tempInput != null && Files.exists(tempInput)) {

                Files.deleteIfExists(tempInput);

                log.debug("Deleted {}", tempInput);
            }

            if (thumbnail != null && Files.exists(thumbnail)) {

                Files.deleteIfExists(thumbnail);

                log.debug("Deleted {}", thumbnail);
            }

            if (hlsOutputDir != null && Files.exists(hlsOutputDir)) {

                deleteDirectory(hlsOutputDir);

                log.debug("Deleted {}", hlsOutputDir);
            }

        } catch (Exception ex) {

            log.warn("Cleanup failed {}", videoId, ex);

        }
    }

    private void deleteDirectory(Path dir) throws IOException {

        Files.walk(dir)
                .sorted(java.util.Comparator.reverseOrder())
                .forEach(path -> {

                    try {

                        Files.deleteIfExists(path);

                    } catch (IOException e) {

                        log.warn("Could not delete {}", path);

                    }

                });

    }

}