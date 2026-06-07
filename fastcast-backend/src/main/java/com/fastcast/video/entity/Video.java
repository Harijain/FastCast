package com.fastcast.video.entity;

import com.fastcast.video.enums.Genre;
import com.fastcast.video.enums.VideoStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "videos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** S3 key of the original uploaded file */
    @Column(name = "s3_raw_key")
    private String s3RawKey;

    /** S3 folder where HLS chunks live */
    @Column(name = "s3_hls_base_path")
    private String s3HlsBasePath;

    @Column
    private Long durationSeconds;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "original_filename")
    private String originalFilename;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VideoStatus status;

    /** Genre tag — added in V2 migration */
    @Enumerated(EnumType.STRING)
    @Column
    private Genre genre;

    /** Thumbnail URL — added in V2 migration */
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    /** Whether the video is visible to all users — added in V2 migration */
    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
