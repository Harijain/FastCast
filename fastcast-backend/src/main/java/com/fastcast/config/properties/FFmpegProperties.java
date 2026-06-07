package com.fastcast.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ffmpeg")
public class FFmpegProperties {
    private String path;
    private String ffprobePath;
    private String outputDir;
}