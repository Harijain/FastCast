package com.fastcast.video.specification;

import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.Genre;
import com.fastcast.video.enums.VideoStatus;
import org.springframework.data.jpa.domain.Specification;

public final class VideoSpecification {

    private VideoSpecification() {
        throw new IllegalStateException("Utility class");
    }

    /**
     * Filter by genre.
     */
    public static Specification<Video> hasGenre(Genre genre) {

        return (root, query, cb) ->

                genre == null
                        ? cb.conjunction()
                        : cb.equal(root.get("genre"), genre);
    }

    /**
     * Filter by processing status.
     */
    public static Specification<Video> hasStatus(VideoStatus status) {

        return (root, query, cb) ->

                status == null
                        ? cb.conjunction()
                        : cb.equal(root.get("status"), status);
    }

    /**
     * Search by title (case insensitive).
     */
    public static Specification<Video> titleContains(String keyword) {

        return (root, query, cb) -> {

            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }

            return cb.like(
                    cb.lower(root.get("title")),
                    "%" + keyword.trim().toLowerCase() + "%"
            );
        };
    }

    /**
     * Show only public videos.
     */
    public static Specification<Video> isPublic(Boolean isPublic) {

        return (root, query, cb) -> {

            if (isPublic == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("isPublic"), isPublic);
        };
    }

}