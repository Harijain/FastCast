package com.fastcast.upload.service;

import com.fastcast.config.properties.AwsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsProperties awsProperties;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "mp4",
            "mkv",
            "avi",
            "mov"
    );

    /**
     * Upload raw video to S3.
     */
    public String uploadRawVideo(
            MultipartFile file,
            UUID videoId
    ) throws IOException {

        String key = buildRawVideoKey(
                videoId,
                file.getOriginalFilename()
        );

        log.info(
                "Uploading video to S3 key={} size={} bytes",
                key,
                file.getSize()
        );

        PutObjectRequest request =
                PutObjectRequest.builder()
                        .bucket(awsProperties.getS3().getBucketName())
                        .key(key)
                        .contentType(file.getContentType())
                        .contentLength(file.getSize())
                        .metadata(
                                java.util.Map.of(
                                        "video-id", videoId.toString()
                                )
                        )
                        .build();

        try {

            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(
                            file.getInputStream(),
                            file.getSize()
                    )
            );

            log.info(
                    "S3 upload completed successfully key={}",
                    key
            );

            return key;

        } catch (S3Exception ex) {

            log.error(
                    "S3 upload failed for key={}",
                    key,
                    ex
            );

            throw ex;
        }
    }

    /**
     * Generate temporary download URL.
     */
    public String generatePresignedUrl(String s3Key) {

        GetObjectRequest getObjectRequest =
                GetObjectRequest.builder()
                        .bucket(awsProperties.getS3().getBucketName())
                        .key(s3Key)
                        .build();

        GetObjectPresignRequest presignRequest =
                GetObjectPresignRequest.builder()
                        .signatureDuration(
                                Duration.ofMinutes(
                                        awsProperties
                                                .getS3()
                                                .getPresignedUrlExpiry()
                                )
                        )
                        .getObjectRequest(getObjectRequest)
                        .build();

        PresignedGetObjectRequest request =
                s3Presigner.presignGetObject(
                        presignRequest
                );

        return request.url().toString();
    }

    /**
     * Delete S3 object.
     */
    public void deleteObject(String s3Key) {

        log.info(
                "Deleting S3 object {}",
                s3Key
        );

        s3Client.deleteObject(
                DeleteObjectRequest.builder()
                        .bucket(
                                awsProperties
                                        .getS3()
                                        .getBucketName()
                        )
                        .key(s3Key)
                        .build()
        );
    }

    /**
     * Build secure storage key.
     *
     * raw/{videoId}/original.mp4
     */
    private String buildRawVideoKey(
            UUID videoId,
            String originalFilename
    ) {

        String extension = "mp4";

        if (originalFilename != null &&
                originalFilename.contains(".")) {

            String extracted =
                    originalFilename.substring(
                            originalFilename.lastIndexOf('.') + 1
                    ).toLowerCase();

            if (ALLOWED_EXTENSIONS.contains(extracted)) {
                extension = extracted;
            }
        }

        return String.format(
                "raw/%s/original.%s",
                videoId,
                extension
        );
    }

}