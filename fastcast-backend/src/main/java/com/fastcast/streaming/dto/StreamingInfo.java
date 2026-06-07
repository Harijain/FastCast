package com.fastcast.streaming.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class StreamingInfo {
    private UUID videoId;
    private String title;
    private Long durationSeconds;
    private String masterPlaylistUrl;
    private String[] qualities;

    /**
     * Where the player should seek to on load.
     * 0 means start from beginning (new viewer or not logged in).
     * Non-zero means the user previously watched up to this point.
     */
    private int resumeAtSeconds;
}
