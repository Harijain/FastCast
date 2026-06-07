package com.fastcast.video.repository;

import com.fastcast.video.entity.Video;
import com.fastcast.video.enums.VideoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VideoRepository extends JpaRepository<Video, UUID> {

    List<Video> findByStatusOrderByCreatedAtDesc(VideoStatus status);

    List<Video> findAllByOrderByCreatedAtDesc();
}