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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
@Tag(name = "Video API", description = "Video metadata endpoints")
public class VideoDeleteController {

    private final VideoRepository videoRepository;
    private final VideoService videoService;
    private final S3Client s3Client;
    private final AwsProperties awsProperties;

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a video and all its S3 assets")
    public ResponseEntity<ApiResponse<Void>> deleteVideo(@PathVariable UUID id) {

        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video", id.toString()));

        // 1. Delete raw file from S3
        if (video.getS3RawKey() != null) {
            deleteS3Object(video.getS3RawKey());
        }

        // 2. Delete all HLS chunks from S3
        if (video.getS3HlsBasePath() != null) {
            deleteS3Prefix(video.getS3HlsBasePath() + "/");
        }

        // 3. Delete thumbnail from S3
        if (video.getThumbnailUrl() != null) {
            String thumbKey = "thumbnails/" + id + "/";
            deleteS3Prefix(thumbKey);
        }

        // 4. Invalidate cache
        videoService.invalidateVideoCache(id);

        // 5. Delete from DB (cascades to watch_history, downloads)
        videoRepository.deleteById(id);

        log.info("Deleted video {} and all S3 assets", id);

        return ResponseEntity.ok(ApiResponse.success("Video deleted successfully", null));
    }

    private void deleteS3Object(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .key(key)
                    .build());
            log.debug("Deleted S3 object: {}", key);
        } catch (Exception e) {
            log.warn("Failed to delete S3 object {}: {}", key, e.getMessage());
        }
    }

    private void deleteS3Prefix(String prefix) {
        try {
            ListObjectsV2Response list = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(awsProperties.getS3().getBucketName())
                            .prefix(prefix)
                            .build());

            if (list.contents().isEmpty()) return;

            List<ObjectIdentifier> toDelete = list.contents().stream()
                    .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                    .collect(Collectors.toList());

            s3Client.deleteObjects(DeleteObjectsRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .delete(d -> d.objects(toDelete))
                    .build());

            log.info("Deleted {} S3 objects under prefix: {}", toDelete.size(), prefix);
        } catch (Exception e) {
            log.warn("Failed to delete S3 prefix {}: {}", prefix, e.getMessage());
        }
    }
}