package com.pocketarc.repository;

import com.pocketarc.model.StoryOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryOptionRepository extends JpaRepository<StoryOption, Long> {
    List<StoryOption> findAllByQuestionIdOrderByOptionOrderAsc(Long questionId);
}