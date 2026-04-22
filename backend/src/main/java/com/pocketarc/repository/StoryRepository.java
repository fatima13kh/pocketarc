package com.pocketarc.repository;

import com.pocketarc.model.Story;
import com.pocketarc.model.enums.StoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    Page<Story> findAllByStatus(StoryStatus status, Pageable pageable);

    Page<Story> findAllByStatusAndTitleContainingIgnoreCase(
            StoryStatus status, String title, Pageable pageable);

    @Query("SELECT s FROM Story s WHERE " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:title IS NULL OR LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
            "(:difficulty IS NULL OR s.difficulty = :difficulty) AND " +
            "(:category IS NULL OR s.category = :category)")
    Page<Story> findWithFilters(
            @Param("status") StoryStatus status,
            @Param("title") String title,
            @Param("difficulty") String difficulty,
            @Param("category") String category,
            Pageable pageable);

    // Admin: all statuses
    @Query("SELECT s FROM Story s WHERE " +
            "(:title IS NULL OR LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
            "(:difficulty IS NULL OR s.difficulty = :difficulty) AND " +
            "(:category IS NULL OR s.category = :category) AND " +
            "(:status IS NULL OR s.status = :status)")
    Page<Story> findAdminWithFilters(
            @Param("title") String title,
            @Param("difficulty") String difficulty,
            @Param("category") String category,
            @Param("status") StoryStatus status,
            Pageable pageable);

    boolean existsByTitleIgnoreCase(String title);
}