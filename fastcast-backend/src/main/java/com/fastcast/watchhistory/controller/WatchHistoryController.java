package com.fastcast.watchhistory.controller;

import com.fastcast.common.response.ApiResponse;
import com.fastcast.user.entity.User;
import com.fastcast.watchhistory.dto.UpdateProgressRequest;
import com.fastcast.watchhistory.dto.WatchHistoryDto;
import com.fastcast.watchhistory.service.WatchHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
@Tag(name = "Watch History API", description = "Track and retrieve watch progress")
public class WatchHistoryController {

    private final WatchHistoryService watchHistoryService;

    @PostMapping("/progress")
    @Operation(summary = "Update watch progress for a video")
    public ResponseEntity<ApiResponse<WatchHistoryDto>> updateProgress(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProgressRequest request) {

        log.info("POST /api/v1/history/progress - user: {}, video: {}, progress: {}s",
                user.getId(), request.getVideoId(), request.getProgressSeconds());

        WatchHistoryDto dto = watchHistoryService.updateProgress(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping
    @Operation(summary = "Get full watch history for the authenticated user")
    public ResponseEntity<ApiResponse<List<WatchHistoryDto>>> getHistory(
            @AuthenticationPrincipal User user) {

        log.info("GET /api/v1/history - user: {}", user.getId());
        List<WatchHistoryDto> history = watchHistoryService.getUserHistory(user.getId());
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/{videoId}")
    @Operation(summary = "Get watch progress for a specific video")
    public ResponseEntity<ApiResponse<WatchHistoryDto>> getProgress(
            @AuthenticationPrincipal User user,
            @PathVariable UUID videoId) {

        log.info("GET /api/v1/history/{} - user: {}", videoId, user.getId());
        WatchHistoryDto dto = watchHistoryService.getProgress(user.getId(), videoId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
