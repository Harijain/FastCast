package com.fastcast.video.dto;

import com.fastcast.video.enums.Genre;
import com.fastcast.video.enums.VideoStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Video search request")
public class VideoSearchRequest {

    @Schema(
            description = "Search by video title",
            example = "avengers"
    )
    private String search;

    @Schema(
            description = "Filter by genre",
            example = "ACTION"
    )
    private Genre genre;

    @Schema(
            description = "Filter by processing status",
            example = "READY"
    )
    private VideoStatus status;

    @Schema(
            description = "Show only public videos",
            example = "true"
    )
    private Boolean isPublic = true;

    @Min(value = 0, message = "Page number cannot be negative")
    @Schema(
            description = "Page number",
            example = "0"
    )
    private int page = 0;

    @Min(value = 1, message = "Minimum page size is 1")
    @Max(value = 100, message = "Maximum page size is 100")
    @Schema(
            description = "Page size",
            example = "12"
    )
    private int size = 12;

    @Schema(
            description = "Sort field",
            allowableValues = {
                    "createdAt",
                    "title",
                    "durationSeconds",
                    "genre"
            },
            example = "createdAt"
    )
    private String sortBy = "createdAt";

    @Schema(
            description = "Sort direction",
            allowableValues = {
                    "ASC",
                    "DESC"
            },
            example = "DESC"
    )
    private String direction = "DESC";

}