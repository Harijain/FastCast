package com.fastcast.processing.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoProcessingEvent {
    private UUID videoId;
    private String s3RawKey;
    private String title;
}