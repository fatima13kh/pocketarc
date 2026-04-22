package com.pocketarc.repository;

import com.pocketarc.model.StoryQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryQuestionRepository extends JpaRepository<StoryQuestion, Long> {
    List<StoryQuestion> findAllByStoryIdOrderByQuestionOrderAsc(Long storyId);
    long countByStoryId(Long storyId);
}