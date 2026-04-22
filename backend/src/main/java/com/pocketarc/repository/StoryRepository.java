package com.pocketarc.repository;

import com.pocketarc.model.Story;
import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import com.pocketarc.model.enums.StoryStatus;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    // For regular users: only published stories
    List<Story> findByStatus(StoryStatus status);

    List<Story> findByStatusAndTitleContainingIgnoreCase(StoryStatus status, String title);

    List<Story> findByStatusAndDifficulty(StoryStatus status, DifficultyLevel difficulty);

    List<Story> findByStatusAndCategory(StoryStatus status, StoryCategory category);

    List<Story> findByStatusAndDifficultyAndCategory(StoryStatus status, DifficultyLevel difficulty, StoryCategory category);

    List<Story> findByStatusAndTitleContainingIgnoreCaseAndDifficulty(StoryStatus status, String title, DifficultyLevel difficulty);

    List<Story> findByStatusAndTitleContainingIgnoreCaseAndCategory(StoryStatus status, String title, StoryCategory category);

    List<Story> findByStatusAndTitleContainingIgnoreCaseAndDifficultyAndCategory(StoryStatus status, String title, DifficultyLevel difficulty, StoryCategory category);

    // For admin: all stories (no status filter)
    @NotNull List<Story> findAll();

    List<Story> findByTitleContainingIgnoreCase(String title);

    List<Story> findByDifficulty(DifficultyLevel difficulty);

    List<Story> findByCategory(StoryCategory category);

    List<Story> findByTitleContainingIgnoreCaseAndDifficulty(String title, DifficultyLevel difficulty);

    List<Story> findByTitleContainingIgnoreCaseAndCategory(String title, StoryCategory category);

    List<Story> findByTitleContainingIgnoreCaseAndStatus(String title, StoryStatus status);

    List<Story> findByDifficultyAndCategory(DifficultyLevel difficulty, StoryCategory category);

    List<Story> findByDifficultyAndStatus(DifficultyLevel difficulty, StoryStatus status);

    List<Story> findByCategoryAndStatus(StoryCategory category, StoryStatus status);

    List<Story> findByTitleContainingIgnoreCaseAndDifficultyAndCategory(String title, DifficultyLevel difficulty, StoryCategory category);

    List<Story> findByTitleContainingIgnoreCaseAndDifficultyAndStatus(String title, DifficultyLevel difficulty, StoryStatus status);

    List<Story> findByTitleContainingIgnoreCaseAndCategoryAndStatus(String title, StoryCategory category, StoryStatus status);

    List<Story> findByDifficultyAndCategoryAndStatus(DifficultyLevel difficulty, StoryCategory category, StoryStatus status);

    List<Story> findByTitleContainingIgnoreCaseAndDifficultyAndCategoryAndStatus(String title, DifficultyLevel difficulty, StoryCategory category, StoryStatus status);

    boolean existsByTitleIgnoreCase(String title);
}