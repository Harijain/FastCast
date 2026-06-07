
package com.fastcast.download.repository;

import com.fastcast.download.entity.VideoDownload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VideoDownloadRepository extends JpaRepository<VideoDownload, UUID> {

    List<VideoDownload> findByUserIdOrderByDownloadedAtDesc(UUID userId);

    long countByVideoId(UUID videoId);
}
