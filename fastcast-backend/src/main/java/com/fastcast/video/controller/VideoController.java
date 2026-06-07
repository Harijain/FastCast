package com.fastcast.video.controller;

import com.fastcast.common.response.ApiResponse;
import com.fastcast.video.dto.VideoDto;
import com.fastcast.video.enums.VideoStatus;
import com.fastcast.video.service.VideoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
@Tag(name = "Video API", description = "Video metadata endpoints")
public class VideoController {

    private final VideoService videoService;

    @GetMapping("/{id}")
    @Operation(summary = "Get video by ID")
    public ResponseEntity<ApiResponse<VideoDto>> getVideo(@PathVariable UUID id) {
        log.info("GET /api/v1/videos/{}", id);
        VideoDto video = videoService.getVideoById(id);
        return ResponseEntity.ok(ApiResponse.success(video));
    }

    @GetMapping
    @Operation(summary = "Get all videos")
    public ResponseEntity<ApiResponse<List<VideoDto>>> getAllVideos() {
        log.info("GET /api/v1/videos");
        List<VideoDto> videos = videoService.getAllVideos();
        return ResponseEntity.ok(ApiResponse.success(videos));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Get video processing status")
    public ResponseEntity<ApiResponse<VideoStatus>> getVideoStatus(@PathVariable UUID id) {
        log.info("GET /api/v1/videos/{}/status", id);
        VideoStatus status = videoService.getVideoStatus(id);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @GetMapping("/by-status")
    @Operation(summary = "Get videos by status")
    public ResponseEntity<ApiResponse<List<VideoDto>>> getVideosByStatus(
            @RequestParam VideoStatus status) {
        log.info("GET /api/v1/videos/by-status?status={}", status);
        List<VideoDto> videos = videoService.getVideosByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(videos));
    }
}