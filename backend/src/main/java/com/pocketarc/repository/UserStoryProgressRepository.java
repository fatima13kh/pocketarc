package com.pocketarc.repository;

import com.pocketarc.model.UserStoryProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserStoryProgressRepository extends JpaRepository<UserStoryProgress, Long> {

    @Query("SELECT p FROM UserStoryProgress p WHERE p.user.id = :userId AND p.story.id = :storyId")
    Optional<UserStoryProgress> findByUserIdAndStoryId(@Param("userId") Long userId, @Param("storyId") Long storyId);

    boolean existsByUserIdAndStoryId(Long userId, Long storyId);

    List<UserStoryProgress> findAllByUserId(Long userId);

    long countByStoryId(Long storyId);

    boolean existsByStoryId(Long storyId);
}