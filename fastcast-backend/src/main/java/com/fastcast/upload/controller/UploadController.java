package com.fastcast.upload.controller;

import com.fastcast.common.response.ApiResponse;
import com.fastcast.upload.dto.VideoUploadRequest;
import com.fastcast.upload.dto.VideoUploadResponse;
import com.fastcast.upload.service.VideoUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
@Tag(name = "Upload API", description = "Video upload endpoints")
public class UploadController {

    private final VideoUploadService videoUploadService;

    @PostMapping(value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a video file")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<ApiResponse<VideoUploadResponse>> uploadVideo(
            @RequestPart("file") MultipartFile file,
            @RequestPart("title") String title,
            @RequestPart(value = "description", required = false) String description)
            throws IOException {

        log.info("POST /api/v1/videos/upload - file: {}, size: {} bytes",
                file.getOriginalFilename(), file.getSize());

        VideoUploadRequest request = new VideoUploadRequest();
        request.setTitle(title);
        request.setDescription(description);

        VideoUploadResponse response = videoUploadService.uploadVideo(file, request);

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Video upload accepted", response));
    }
}