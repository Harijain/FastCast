package com.fastcast.download.service;

import com.fastcast.common.exception.ResourceNotFoundException;
import com.fastcast.config.properties.AwsProperties;
import com.fastcast.download.dto.DownloadHistoryDto;
import com.fastcast.download.dto.DownloadResponse;
import com.fastcast.download.entity.VideoDownload;
import com.fastcast.download.repository.VideoDownloadRepository;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DownloadService {

    private final VideoRepository videoRepository;
    private final VideoDownloadRepository downloadRepository;
    private final S3Presigner s3Presigner;
    private final AwsProperties awsProperties;

    private static final List<String> VALID_QUALITIES = List.of("original", "720p", "480p", "240p");

    /**
     * Generates a pre-signed S3 download URL.
     *
     * For "original" quality: points to the raw uploaded file (mp4/mkv as-is).
     * For "720p"/"480p"/"240p": we package the HLS segments as a virtual path —
     * actually we point to a re-muxed MP4 if available, otherwise the highest
     * segment. In practice for offline viewing the client would need a downloader
     * that understands HLS, so we return the master playlist URL for quality
     * versions and let the client handle the download (e.g. using yt-dlp or
     * a native HLS downloader).
     *
     * This keeps our backend simple and stateless — we don't re-encode on demand.
     */
    @Transactional
    public DownloadResponse generateDownloadUrl(UUID userId, UUID videoId, String quality) {
        validateQuality(quality);
        Video video = getReadyVideo(videoId);

        String s3Key = resolveS3Key(video, quality);
        long expiryMinutes = awsProperties.getS3().getPresignedUrlExpiry();

        String downloadUrl = presign(s3Key, expiryMinutes);

        // Record the download event
        VideoDownload record = VideoDownload.builder()
                .userId(userId)
                .videoId(videoId)
                .quality(quality)
                .build();
        downloadRepository.save(record);

        log.info("Download URL generated — user: {}, video: {}, quality: {}", userId, videoId, quality);

        return DownloadResponse.builder()
                .videoId(videoId)
                .title(video.getTitle())
                .quality(quality)
                .downloadUrl(downloadUrl)
                .expiresInMinutes(expiryMinutes)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DownloadHistoryDto> getUserDownloadHistory(UUID userId) {
        return downloadRepository.findByUserIdOrderByDownloadedAtDesc(userId)
                .stream()
                .map(d -> {

                    Video video = videoRepository.findById(d.getVideoId())
                            .orElse(null);

                    return DownloadHistoryDto.builder()
                            .id(d.getId())
                            .videoId(d.getVideoId())
                            .videoTitle(video != null ? video.getTitle() : "Unknown Video")
                            .thumbnailUrl(video != null ? video.getThumbnailUrl() : null)
                            .fileSizeBytes(video != null ? video.getFileSizeBytes() : null)
                            .quality(d.getQuality())
                            .downloadedAt(d.getDownloadedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Resolves the correct S3 key based on quality:
     * - "original" → the raw uploaded file key stored in video.s3RawKey
     * - quality → master.m3u8 of that quality rendition
     * (client uses an HLS downloader to fetch all segments)
     */
    private String resolveS3Key(Video video, String quality) {
        if ("original".equals(quality)) {
            if (video.getS3RawKey() == null) {
                throw new IllegalStateException("Original file not available for video: " + video.getId());
            }
            return video.getS3RawKey();
        }

        // For a specific quality rendition, return the index.m3u8 of that stream.
        // The client (e.g. a mobile app with offline download support) should use
        // an HLS-aware downloader (AVAssetDownloadTask on iOS, ExoPlayer
        // DownloadManager
        // on Android) to resolve and download all segments from the playlist.
        if (video.getS3HlsBasePath() == null) {
            throw new IllegalStateException("HLS not available for video: " + video.getId());
        }
        return video.getS3HlsBasePath() + "/stream_" + quality + "/index.m3u8";
    }

    private String presign(String s3Key, long expiryMinutes) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiryMinutes))
                .getObjectRequest(r -> r
                        .bucket(awsProperties.getS3().getBucketName())
                        .key(s3Key))
                .build();
        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }

    private Video getReadyVideo(UUID videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video", videoId.toString()));
        if (video.getStatus() != VideoStatus.READY) {
            throw new IllegalArgumentException(
                    "Video is not ready for download. Status: " + video.getStatus());
        }
        return video;
    }

    private void validateQuality(String quality) {
        if (!VALID_QUALITIES.contains(quality)) {
            throw new IllegalArgumentException(
                    "Invalid quality: " + quality + ". Use: original, 720p, 480p, 240p");
        }
    }
}
