package com.pocketarc.model;

import com.pocketarc.model.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "stories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "difficulty_level", nullable = false)
    private DifficultyLevel difficulty;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "story_category", nullable = false)
    private StoryCategory category;

    @Column(name = "reward_per_correct", nullable = false, precision = 10, scale = 2)
    private BigDecimal rewardPerCorrect = BigDecimal.ZERO;

    @Column(name = "penalty_per_wrong", nullable = false, precision = 10, scale = 2)
    private BigDecimal penaltyPerWrong = BigDecimal.ZERO;

    @Column(name = "opening_content", columnDefinition = "TEXT")
    private String openingContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_type",
            columnDefinition = "author_type",
            nullable = false)
    private AuthorType authorType;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "story_status", nullable = false)
    private StoryStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    private List<StoryQuestion> questions;
}