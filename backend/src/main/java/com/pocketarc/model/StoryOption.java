package com.pocketarc.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "story_options")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoryOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private StoryQuestion question;

    @Column(name = "option_order", nullable = false)
    private Integer optionOrder;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;

    @Column(name = "reasoning_text", columnDefinition = "TEXT")
    private String reasoningText;
}