package com.pocketarc.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_story_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "story_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserStoryProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Column(name = "completed_story", nullable = false)
    private Boolean completedStory = false;

    @Column(name = "total_reward_claimed", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalRewardClaimed = BigDecimal.ZERO;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}