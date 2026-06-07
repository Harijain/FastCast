package com.fastcast.upload.dto;

import com.fastcast.video.enums.VideoStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class VideoUploadResponse {
    private UUID videoId;
    private String title;
    private VideoStatus status;
    private String message;
}