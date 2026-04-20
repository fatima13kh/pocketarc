package com.pocketarc.repository;

import com.pocketarc.model.Story;
import com.pocketarc.model.enums.StoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findAllByStatus(StoryStatus status);
    List<Story> findAllByStatusAndTitleContainingIgnoreCase(StoryStatus status, String title);
}