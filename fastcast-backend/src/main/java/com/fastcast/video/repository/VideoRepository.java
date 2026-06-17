package com.fastcast.video.repository;

import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface VideoRepository
        extends JpaRepository<Video, UUID>,
        JpaSpecificationExecutor<Video> {

    /**
     * Returns all videos ordered by newest first.
     */
    List<Video> findAllByOrderByCreatedAtDesc();

    /**
     * Returns videos having a particular processing status.
     */
    List<Video> findByStatusOrderByCreatedAtDesc(VideoStatus status);

}