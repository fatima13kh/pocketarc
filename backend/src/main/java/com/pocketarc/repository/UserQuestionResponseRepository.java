package com.pocketarc.repository;

import com.pocketarc.model.UserQuestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserQuestionResponseRepository extends JpaRepository<UserQuestionResponse, Long> {
    List<UserQuestionResponse> findAllByProgressId(Long progressId);
}