package com.fastcast.watchhistory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateProgressRequest {

    @NotNull(message = "Video ID is required")
    private UUID videoId;

    @Min(value = 0, message = "Progress cannot be negative")
    private int progressSeconds;

    private boolean completed;
}