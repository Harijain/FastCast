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
import java.util.Comparator;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class HlsUploadService {

    private final S3Client s3Client;
    private final AwsProperties awsProperties;

    public String uploadHlsToS3(Path hlsOutputDir, UUID videoId)
            throws IOException {

        String s3BasePath = "hls/" + videoId;

        log.info(
                "Starting HLS upload for videoId={}",
                videoId
        );

        try (Stream<Path> paths = Files.walk(hlsOutputDir)) {

            paths.filter(Files::isRegularFile)
                    .sorted(Comparator.naturalOrder())
                    .forEach(path ->
                            uploadFile(
                                    path,
                                    hlsOutputDir,
                                    s3BasePath,
                                    videoId
                            ));

        }

        log.info(
                "Completed HLS upload for videoId={}",
                videoId
        );

        return s3BasePath;
    }

    private void uploadFile(
            Path file,
            Path baseDir,
            String s3BasePath,
            UUID videoId
    ) {

        String relativePath =
                baseDir.relativize(file)
                        .toString()
                        .replace("\\", "/");

        String s3Key =
                s3BasePath + "/" + relativePath;

        try {

            PutObjectRequest request =
                    PutObjectRequest.builder()
                            .bucket(
                                    awsProperties
                                            .getS3()
                                            .getBucketName()
                            )
                            .key(s3Key)
                            .contentType(
                                    getContentType(file)
                            )
                            .cacheControl(
                                    "public,max-age=31536000"
                            )
                            .metadata(
                                    Map.of(
                                            "video-id",
                                            videoId.toString()
                                    )
                            )
                            .build();

            s3Client.putObject(
                    request,
                    RequestBody.fromFile(file)
            );

            log.debug(
                    "Uploaded {}",
                    s3Key
            );

        } catch (Exception ex) {

            log.error(
                    "Failed uploading {}",
                    s3Key,
                    ex
            );

            throw new RuntimeException(
                    "Failed to upload HLS file: " + s3Key,
                    ex
            );

        }

    }

    private String getContentType(Path file) {

        String name =
                file.getFileName()
                        .toString()
                        .toLowerCase();

        if (name.endsWith(".m3u8")) {
            return "application/vnd.apple.mpegurl";
        }

        if (name.endsWith(".ts")) {
            return "video/mp2t";
        }

        return "application/octet-stream";

    }

}