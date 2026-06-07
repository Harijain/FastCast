package com.fastcast.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "aws")
public class AwsProperties {

    private String region;
    private String accessKey;
    private String secretKey;
    private S3 s3 = new S3();

    @Getter
    @Setter
    public static class S3 {
        private String bucketName;
        private int presignedUrlExpiry;
    }
}