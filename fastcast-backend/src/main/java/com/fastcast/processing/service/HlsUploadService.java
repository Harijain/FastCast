package com.fastcast.processing.service;

import com.fastcast.config.properties.AwsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class HlsUploadService {

    private final S3Client s3Client;
    private final AwsProperties awsProperties;

    // Upload entire HLS output directory to S3
    public String uploadHlsToS3(Path hlsOutputDir, UUID videoId) throws IOException {
        String s3BasePath = "hls/" + videoId;
        log.info("Uploading HLS chunks to S3 at: {}", s3BasePath);

        try (Stream<Path> paths = Files.walk(hlsOutputDir)) {
            paths.filter(Files::isRegularFile)
                    .forEach(file -> uploadFile(file, hlsOutputDir, s3BasePath));
        }

        log.info("HLS upload complete for videoId: {}", videoId);
        return s3BasePath;
    }

    private void uploadFile(Path file, Path baseDir, String s3BasePath) {
        try {
            // relativize to get path like: stream_720p/segment001.ts
            String relativePath = baseDir.relativize(file)
                    .toString()
                    .replace("\\", "/");

            String s3Key = s3BasePath + "/" + relativePath;
            String contentType = getContentType(file.toString());

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .key(s3Key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(request, RequestBody.fromFile(file));
            log.debug("Uploaded: {}", s3Key);

        } catch (Exception e) {
            log.error("Failed to upload file: {}", file, e);
            throw new RuntimeException("HLS upload failed for file: " + file, e);
        }
    }

    private String getContentType(String filename) {
        if (filename.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
        if (filename.endsWith(".ts"))   return "video/mp2t";
        return "application/octet-stream";
    }
}