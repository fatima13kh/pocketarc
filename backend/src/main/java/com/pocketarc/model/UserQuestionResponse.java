package com.pocketarc.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_question_responses",
        uniqueConstraints = @UniqueConstraint(columnNames = {"progress_id", "question_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserQuestionResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progress_id", nullable = false)
    private UserStoryProgress progress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private StoryQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id", nullable = false)
    private StoryOption selectedOption;

    @Column(name = "cash_effect_applied", nullable = false, precision = 10, scale = 2)
    private BigDecimal cashEffectApplied = BigDecimal.ZERO;

    @Column(name = "answered_at", nullable = false)
    private LocalDateTime answeredAt = LocalDateTime.now();
}