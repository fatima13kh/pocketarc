package com.pocketarc.repository;

import com.pocketarc.model.UserStoryProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserStoryProgressRepository extends JpaRepository<UserStoryProgress, Long> {
    Optional<UserStoryProgress> findByUserIdAndStoryId(Long userId, Long storyId);
    boolean existsByUserIdAndStoryId(Long userId, Long storyId);
    List<UserStoryProgress> findAllByUserId(Long userId);
}