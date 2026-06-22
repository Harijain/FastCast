package com.fastcast.video.controller;

import com.fastcast.common.exception.ResourceNotFoundException;
import com.fastcast.common.response.ApiResponse;
import com.fastcast.config.properties.AwsProperties;
import com.fastcast.video.entity.Video;
import com.fastcast.video.repository.VideoRepository;
import com.fastcast.video.service.VideoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
@Tag(name = "Thumbnail API", description = "Upload and manage video thumbnails")
public class ThumbnailController {

    private final VideoRepository videoRepository;
    private final VideoService videoService;
    private final S3Client s3Client;
    private final AwsProperties awsProperties;

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    @PostMapping(value = "/{id}/thumbnail",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a thumbnail image for a video")
    public ResponseEntity<ApiResponse<String>> uploadThumbnail(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) throws IOException {

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "Unsupported image type. Use JPEG, PNG, or WebP.");
        }

        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video", id.toString()));

        String ext = file.getOriginalFilename() != null &&
                file.getOriginalFilename().contains(".")
                ? file.getOriginalFilename()
                .substring(file.getOriginalFilename().lastIndexOf('.'))
                .toLowerCase()
                : ".jpg";

        String s3Key = "thumbnails/" + id + "/thumb" + ext;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(awsProperties.getS3().getBucketName())
                .key(s3Key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .cacheControl("public,max-age=86400")
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(
                file.getInputStream(), file.getSize()));

        // Build the public URL (works if bucket has public-read on thumbnails/)
        String thumbnailUrl = "https://" + awsProperties.getS3().getBucketName()
                + ".s3." + awsProperties.getRegion()
                + ".amazonaws.com/" + s3Key;

        video.setThumbnailUrl(thumbnailUrl);
        videoRepository.save(video);
        videoService.invalidateVideoCache(id);

        log.info("Thumbnail uploaded for videoId: {} → {}", id, s3Key);

        return ResponseEntity.ok(ApiResponse.success(
                "Thumbnail uploaded successfully", thumbnailUrl));
    }
}