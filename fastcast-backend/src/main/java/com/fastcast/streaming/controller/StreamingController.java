package com.fastcast.streaming.controller;

import com.fastcast.common.exception.ResourceNotFoundException;
import com.fastcast.config.properties.AwsProperties;
import com.fastcast.metrics.service.LatencyMetricsService;
import com.fastcast.streaming.dto.StreamingInfo;
import com.fastcast.user.entity.User;
import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.repository.VideoRepository;
import com.fastcast.watchhistory.dto.UpdateProgressRequest;
import com.fastcast.watchhistory.service.WatchHistoryService;
import io.micrometer.core.instrument.Timer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/stream")
@RequiredArgsConstructor
@Tag(name = "Streaming API", description = "HLS video streaming endpoints")
public class StreamingController {

    private final VideoRepository videoRepository;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsProperties awsProperties;
    private final LatencyMetricsService latencyMetrics;
    private final WatchHistoryService watchHistoryService;

    /*
     * Bandwidth values match FFmpegService QUALITIES array exactly:
     *   720p  → video 2800k + audio 128k  = 2928000 bps peak
     *   480p  → video 1400k + audio 128k  = 1528000 bps peak
     *   240p  → video  400k + audio  64k  =  464000 bps peak
     *
     * Without these BANDWIDTH tags, HLS players (hls.js, Video.js, native Safari)
     * cannot perform adaptive bitrate switching — they just play the first rendition
     * forever regardless of network conditions. This is the fix.
     *
     * AVERAGE-BANDWIDTH is ~80% of peak — the realistic sustained bitrate.
     * CODECS string uses H.264 Baseline/Main/High profile level identifiers.
     */
    private static final String MASTER_PLAYLIST_TEMPLATE =
            "#EXTM3U\n" +
                    "#EXT-X-VERSION:3\n" +
                    "\n" +
                    "#EXT-X-STREAM-INF:BANDWIDTH=2928000,AVERAGE-BANDWIDTH=2400000," +
                    "RESOLUTION=1280x720,CODECS=\"avc1.64001f,mp4a.40.2\",NAME=\"720p\"\n" +
                    "%s/720p/index.m3u8\n" +
                    "\n" +
                    "#EXT-X-STREAM-INF:BANDWIDTH=1528000,AVERAGE-BANDWIDTH=1200000," +
                    "RESOLUTION=854x480,CODECS=\"avc1.64001e,mp4a.40.2\",NAME=\"480p\"\n" +
                    "%s/480p/index.m3u8\n" +
                    "\n" +
                    "#EXT-X-STREAM-INF:BANDWIDTH=464000,AVERAGE-BANDWIDTH=380000," +
                    "RESOLUTION=426x240,CODECS=\"avc1.640015,mp4a.40.2\",NAME=\"240p\"\n" +
                    "%s/240p/index.m3u8\n";

    // ── Master playlist ──────────────────────────────────────────────────────
    @GetMapping("/{id}/master.m3u8")
    @Operation(summary = "Get master HLS playlist (proper BANDWIDTH tags for adaptive switching)")
    public ResponseEntity<String> getMasterPlaylist(@PathVariable UUID id) {
        Timer.Sample sample = latencyMetrics.startSample();
        getReadyVideo(id); // validates video exists and is READY

        // Build playlist entirely on our side so we control the BANDWIDTH tags.
        // FFmpeg's generated master.m3u8 omits these tags which breaks ABR.
        String qualityBase = "/api/v1/stream/" + id;
        String content = String.format(MASTER_PLAYLIST_TEMPLATE,
                qualityBase, qualityBase, qualityBase);

        sample.stop(latencyMetrics.getStreamingStartupTimer());
        log.info("Serving master playlist for videoId: {}", id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(content);
    }

    // ── Quality-specific playlist ────────────────────────────────────────────
    @GetMapping("/{id}/{quality}/index.m3u8")
    @Operation(summary = "Get quality-specific HLS playlist")
    public ResponseEntity<String> getQualityPlaylist(
            @PathVariable UUID id,
            @PathVariable String quality) throws IOException {

        Video video = getReadyVideo(id);
        validateQuality(quality);

        String s3Key = video.getS3HlsBasePath() + "/stream_" + quality + "/index.m3u8";
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(awsProperties.getS3().getBucketName())
                .key(s3Key)
                .build();

        String content;
        try (ResponseInputStream<GetObjectResponse> response = s3Client.getObject(request)) {
            content = new String(response.readAllBytes());
        }

        // Rewrite relative segment names → absolute API paths
        content = content.replaceAll(
                "segment(\\d+)\\.ts",
                "/api/v1/stream/" + id + "/" + quality + "/segment$1.ts"
        );

        log.info("Serving {} playlist for videoId: {}", quality, id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(content);
    }

    // ── TS segment — redirect to presigned S3 URL ────────────────────────────
    @GetMapping("/{id}/{quality}/{segment}.ts")
    @Operation(summary = "Stream a video segment (302 redirect to presigned S3 URL)")
    public ResponseEntity<Void> getSegment(
            @PathVariable UUID id,
            @PathVariable String quality,
            @PathVariable String segment) {

        Video video = getReadyVideo(id);
        validateQuality(quality);

        String s3Key = video.getS3HlsBasePath()
                + "/stream_" + quality
                + "/" + segment + ".ts";

        String presignedUrl = generatePresignedUrl(s3Key);
        log.debug("Redirecting {}/{}.ts to presigned S3 URL", quality, segment);

        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(presignedUrl))
                .build();
    }

    // ── Streaming info + resume position ─────────────────────────────────────
    @GetMapping("/{id}/info")
    @Operation(summary = "Get streaming info — includes resume position for authenticated users")
    public ResponseEntity<StreamingInfo> getStreamingInfo(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        Video video = getReadyVideo(id);

        // Resume position — 0 if user not logged in or no history yet
        int resumeSeconds = 0;
        if (user != null) {
            try {
                resumeSeconds = watchHistoryService
                        .getProgress(user.getId(), id)
                        .getProgressSeconds();
            } catch (ResourceNotFoundException e) {
                resumeSeconds = 0;
            }
        }

        return ResponseEntity.ok(StreamingInfo.builder()
                .videoId(video.getId())
                .title(video.getTitle())
                .durationSeconds(video.getDurationSeconds())
                .masterPlaylistUrl("/api/v1/stream/" + id + "/master.m3u8")
                .qualities(new String[]{"720p", "480p", "240p"})
                .resumeAtSeconds(resumeSeconds)
                .build());
    }

    // ── Progress update (player calls this every ~10 seconds) ────────────────
    @PostMapping("/{id}/progress")
    @Operation(summary = "Report current playback position — call every 10s from the player")
    public ResponseEntity<Void> updateProgress(
            @PathVariable UUID id,
            @RequestParam int progressSeconds,
            @RequestParam(defaultValue = "false") boolean completed,
            @AuthenticationPrincipal User user) {

        if (user != null) {
            UpdateProgressRequest req = new UpdateProgressRequest();
            req.setVideoId(id);
            req.setProgressSeconds(progressSeconds);
            req.setCompleted(completed);
            watchHistoryService.updateProgress(user.getId(), req);
            log.debug("Progress saved — user: {}, video: {}, at: {}s", user.getId(), id, progressSeconds);
        }
        return ResponseEntity.ok().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Video getReadyVideo(UUID id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video", id.toString()));
        if (video.getStatus() != VideoStatus.READY) {
            throw new IllegalArgumentException(
                    "Video is not ready. Current status: " + video.getStatus());
        }
        return video;
    }

    private void validateQuality(String quality) {
        if (!quality.equals("720p") && !quality.equals("480p") && !quality.equals("240p")) {
            throw new IllegalArgumentException(
                    "Invalid quality: " + quality + ". Use 720p, 480p or 240p");
        }
    }

    private String generatePresignedUrl(String s3Key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(
                        awsProperties.getS3().getPresignedUrlExpiry()))
                .getObjectRequest(r -> r
                        .bucket(awsProperties.getS3().getBucketName())
                        .key(s3Key))
                .build();
        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }
}
