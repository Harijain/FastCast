package com.fastcast.watchhistory.repository;

import com.fastcast.watchhistory.entity.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, UUID> {

    Optional<WatchHistory> findByUserIdAndVideoId(UUID userId, UUID videoId);

    List<WatchHistory> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    List<WatchHistory> findByVideoIdOrderByUpdatedAtDesc(UUID videoId);

    long countByVideoIdAndCompleted(UUID videoId, Boolean completed);
}
