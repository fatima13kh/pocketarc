package com.pocketarc.repository;

import com.pocketarc.model.OtpCode;
import com.pocketarc.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByUserAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            User user, LocalDateTime now);
    void deleteAllByUser(User user);
}