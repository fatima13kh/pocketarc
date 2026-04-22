package com.pocketarc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pocketarc.dto.request.*;
import com.pocketarc.dto.response.*;
import com.pocketarc.exception.*;
import com.pocketarc.model.*;
import com.pocketarc.model.enums.*;
import com.pocketarc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository            storyRepository;
    private final StoryQuestionRepository    questionRepository;
    private final StoryOptionRepository      optionRepository;
    private final UserStoryProgressRepository progressRepository;
    private final UserQuestionResponseRepository responseRepository;
    private final UserRepository             userRepository;

    @Value("${groq.api-key}")
    private String groqApiKey;

    private static final int PAGE_SIZE = 10;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ─────────────────────────────────────────────────────────────────────────
    // USER — GET STORIES (paginated, published only)
    // ─────────────────────────────────────────────────────────────────────────

    public StoryPageResponse getUserStories(
            Long userId, String search, String difficulty,
            String category, String sortBy, int page) {

        Pageable pageable = buildPageable(sortBy, page);

        Page<Story> storyPage = storyRepository.findWithFilters(
                StoryStatus.PUBLISHED, search, difficulty, category, pageable);

        List<StoryResponse> stories = storyPage.getContent().stream()
                .map(s -> mapToResponse(s, userId, false))
                .collect(Collectors.toList());

        return new StoryPageResponse(
                stories,
                storyPage.getNumber(),
                storyPage.getTotalPages(),
                storyPage.getTotalElements());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — GET STORIES (all statuses, paginated)
    // ─────────────────────────────────────────────────────────────────────────

    public StoryPageResponse getAdminStories(
            String search, String difficulty,
            String category, String status, String sortBy, int page) {

        Pageable pageable = buildPageable(sortBy, page);

        StoryStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = StoryStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        Page<Story> storyPage = storyRepository.findAdminWithFilters(
                search, difficulty, category, statusEnum, pageable);

        List<StoryResponse> stories = storyPage.getContent().stream()
                .map(s -> mapToResponse(s, null, true))
                .collect(Collectors.toList());

        return new StoryPageResponse(
                stories,
                storyPage.getNumber(),
                storyPage.getTotalPages(),
                storyPage.getTotalElements());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET SINGLE STORY
    // ─────────────────────────────────────────────────────────────────────────

    public StoryResponse getStory(Long storyId, Long userId, boolean isAdmin) {
        Story story = findById(storyId);
        if (!isAdmin && story.getStatus() != StoryStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Story not found");
        }
        return mapToResponse(story, userId, isAdmin);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — CREATE STORY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public StoryResponse createStory(CreateStoryRequest request) {
        Story story = Story.builder()
                .title(request.title())
                .difficulty(request.difficulty())
                .category(request.category())
                .openingContent(request.openingContent())
                .rewardPerCorrect(request.rewardPerCorrect())
                .penaltyPerWrong(request.penaltyPerWrong())
                .authorType(AuthorType.ADMIN)
                .status(request.status())
                .createdAt(LocalDateTime.now())
                .publishedAt(request.status() == StoryStatus.PUBLISHED
                        ? LocalDateTime.now() : null)
                .build();

        story = storyRepository.save(story);
        saveQuestions(story, request.questions());

        Story saved = storyRepository.findById(story.getId()).orElseThrow();
        return mapToResponse(saved, null, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — UPDATE STORY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public StoryResponse updateStory(Long storyId, UpdateStoryRequest request) {
        Story story = findById(storyId);

        boolean hasPlays = progressRepository.existsByStoryId(storyId);
        if (hasPlays) {
            throw new BusinessException(
                    "This story has been played by users. " +
                            "Please create a new version instead of editing it.");
        }

        if (request.title() != null) story.setTitle(request.title());
        if (request.difficulty() != null) story.setDifficulty(request.difficulty());
        if (request.category() != null) story.setCategory(request.category());
        if (request.openingContent() != null) story.setOpeningContent(request.openingContent());
        if (request.rewardPerCorrect() != null) story.setRewardPerCorrect(request.rewardPerCorrect());
        if (request.penaltyPerWrong() != null) story.setPenaltyPerWrong(request.penaltyPerWrong());
        if (request.status() != null) {
            story.setStatus(request.status());
            if (request.status() == StoryStatus.PUBLISHED && story.getPublishedAt() == null) {
                story.setPublishedAt(LocalDateTime.now());
            }
        }
        if (request.questions() != null && !request.questions().isEmpty()) {
            // Remove old questions and replace
            story.getQuestions().clear();
            storyRepository.save(story);
            saveQuestions(story, request.questions());
        }

        storyRepository.save(story);
        Story updated = storyRepository.findById(storyId).orElseThrow();
        return mapToResponse(updated, null, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — DELETE STORY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse deleteStory(Long storyId) {
        Story story = findById(storyId);
        // User progress is preserved — cascade delete won't affect user_question_responses
        // because we keep progress but just lose the story reference
        storyRepository.delete(story);
        return new ApiResponse(true, "Story deleted successfully.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — PUBLISH / DRAFT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public StoryResponse publishStory(Long storyId) {
        Story story = findById(storyId);
        story.setStatus(StoryStatus.PUBLISHED);
        if (story.getPublishedAt() == null) {
            story.setPublishedAt(LocalDateTime.now());
        }
        storyRepository.save(story);
        return mapToResponse(story, null, true);
    }

    @Transactional
    public StoryResponse draftStory(Long storyId) {
        Story story = findById(storyId);
        story.setStatus(StoryStatus.DRAFT);
        storyRepository.save(story);
        return mapToResponse(story, null, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — GENERATE STORY VIA GROQ AI
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public StoryResponse generateStory(GenerateStoryRequest request) {
        String prompt = buildGroqPrompt(request.difficulty(), request.category());
        String groqResponse = callGroqApi(prompt);
        Story story = parseAndSaveGroqStory(groqResponse, request.difficulty(), request.category());
        Story saved = storyRepository.findById(story.getId()).orElseThrow();
        return mapToResponse(saved, null, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER — START / RESUME STORY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public StoryResponse startOrResumeStory(Long storyId, Long userId) {
        Story story = findById(storyId);
        if (story.getStatus() != StoryStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Story not found");
        }

        // Get or create progress
        UserStoryProgress progress = progressRepository
                .findByUserIdAndStoryId(userId, storyId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId).orElseThrow();
                    return progressRepository.save(UserStoryProgress.builder()
                            .user(user)
                            .story(story)
                            .completedStory(false)
                            .totalRewardClaimed(BigDecimal.ZERO)
                            .build());
                });

        return mapToResponse(story, userId, false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER — SUBMIT ANSWER
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AnswerResultResponse submitAnswer(
            Long storyId, Long userId, SubmitAnswerRequest request) {

        Story story = findById(storyId);
        User user = userRepository.findById(userId).orElseThrow();

        UserStoryProgress progress = progressRepository
                .findByUserIdAndStoryId(userId, storyId)
                .orElseThrow(() -> new BusinessException(
                        "Please start the story first"));

        if (progress.getCompletedStory()) {
            throw new BusinessException("You have already completed this story");
        }

        StoryQuestion question = questionRepository.findById(request.questionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        StoryOption option = optionRepository.findById(request.selectedOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Option not found"));

        // Check already answered
        boolean alreadyAnswered = responseRepository
                .findAllByProgressId(progress.getId())
                .stream()
                .anyMatch(r -> r.getQuestion().getId().equals(request.questionId()));

        if (alreadyAnswered) {
            throw new BusinessException("Question already answered");
        }

        // Calculate cash effect
        BigDecimal cashEffect = option.getIsCorrect()
                ? story.getRewardPerCorrect()
                : story.getPenaltyPerWrong().negate();

        // Apply to balance
        user.setCashBalance(user.getCashBalance().add(cashEffect));
        userRepository.save(user);

        // Save response
        responseRepository.save(UserQuestionResponse.builder()
                .progress(progress)
                .question(question)
                .selectedOption(option)
                .cashEffectApplied(cashEffect)
                .answeredAt(LocalDateTime.now())
                .build());

        // Update progress reward
        progress.setTotalRewardClaimed(
                progress.getTotalRewardClaimed().add(cashEffect));
        progressRepository.save(progress);

        return new AnswerResultResponse(
                request.questionId(),
                request.selectedOptionId(),
                option.getIsCorrect(),
                option.getReasoningText(),
                cashEffect,
                user.getCashBalance());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER — COMPLETE STORY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public StoryCompletionResponse completeStory(Long storyId, Long userId) {
        Story story = findById(storyId);
        User user = userRepository.findById(userId).orElseThrow();

        UserStoryProgress progress = progressRepository
                .findByUserIdAndStoryId(userId, storyId)
                .orElseThrow(() -> new BusinessException("Story progress not found"));

        long totalQuestions = questionRepository.countByStoryId(storyId);
        long answeredQuestions = responseRepository.findAllByProgressId(progress.getId()).size();

        if (answeredQuestions < totalQuestions) {
            throw new BusinessException("Please answer all questions before completing");
        }

        progress.setCompletedStory(true);
        progress.setCompletedAt(LocalDateTime.now());
        progressRepository.save(progress);

        // Build answer summary
        List<UserQuestionResponse> responses =
                responseRepository.findAllByProgressId(progress.getId());

        List<StoryCompletionResponse.AnswerSummary> summaries = responses.stream()
                .map(r -> new StoryCompletionResponse.AnswerSummary(
                        r.getQuestion().getQuestionText(),
                        r.getSelectedOption().getOptionText(),
                        r.getSelectedOption().getIsCorrect(),
                        r.getCashEffectApplied(),
                        r.getSelectedOption().getReasoningText()))
                .collect(Collectors.toList());

        return new StoryCompletionResponse(
                story.getTitle(),
                progress.getTotalRewardClaimed(),
                user.getCashBalance(),
                summaries);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK IF STORY HAS SIMILAR TITLE
    // ─────────────────────────────────────────────────────────────────────────

    public Map<String, Object> checkSimilarStory(String title) {
        boolean exists = storyRepository.existsByTitleIgnoreCase(title);
        Map<String, Object> result = new HashMap<>();
        result.put("hasSimilar", exists);
        result.put("message", exists
                ? "A story with a similar title already exists. Please review before saving."
                : null);
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROQ INTEGRATION
    // ─────────────────────────────────────────────────────────────────────────

    private String buildGroqPrompt(DifficultyLevel difficulty, StoryCategory category) {
        return String.format("""
            You are a financial literacy expert. Create an investment story for educational purposes.
            
            Requirements:
            - Difficulty: %s
            - Category: %s
            - The story must be realistic, educational and professionally written
            - Include exactly 2 questions per story
            - Each question must have exactly 3 choices
            - One choice per question must be correct
            - Include clear financial reasoning for each choice
            
            Respond ONLY with valid JSON in this exact format:
            {
              "title": "Story title here",
              "openingContent": "Brief story context here",
              "rewardPerCorrect": 200,
              "penaltyPerWrong": 100,
              "questions": [
                {
                  "questionOrder": 1,
                  "questionText": "Question text here",
                  "options": [
                    {
                      "optionOrder": 1,
                      "optionText": "Option text",
                      "isCorrect": false,
                      "reasoningText": "Explanation why this is wrong or right"
                    },
                    {
                      "optionOrder": 2,
                      "optionText": "Option text",
                      "isCorrect": true,
                      "reasoningText": "Explanation why this is correct"
                    },
                    {
                      "optionOrder": 3,
                      "optionText": "Option text",
                      "isCorrect": false,
                      "reasoningText": "Explanation why this is wrong"
                    }
                  ]
                }
              ]
            }
            """, difficulty.name(), category.name());
    }

    private String callGroqApi(String prompt) {
        try {
            OkHttpClient client = new OkHttpClient();
            String requestBody = String.format("""
                {
                  "model": "llama3-8b-8192",
                  "messages": [
                    {"role": "user", "content": %s}
                  ],
                  "temperature": 0.7,
                  "max_tokens": 2000
                }
                """, objectMapper.writeValueAsString(prompt));

            Request request = new Request.Builder()
                    .url("https://api.groq.com/openai/v1/chat/completions")
                    .addHeader("Authorization", "Bearer " + groqApiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(requestBody,
                            MediaType.get("application/json")))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new BusinessException("AI generation failed. Please try again.");
                }
                String body = response.body().string();
                JsonNode node = objectMapper.readTree(body);
                return node.path("choices").get(0)
                        .path("message").path("content").asText();
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage());
            throw new BusinessException("AI generation failed. Please try again.");
        }
    }

    @Transactional
    private Story parseAndSaveGroqStory(
            String json, DifficultyLevel difficulty, StoryCategory category) {
        try {
            // Strip markdown code blocks if present
            String cleaned = json.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("```json\\n?", "")
                        .replaceAll("```\\n?", "").trim();
            }

            JsonNode root = objectMapper.readTree(cleaned);

            Story story = Story.builder()
                    .title(root.path("title").asText())
                    .difficulty(difficulty)
                    .category(category)
                    .openingContent(root.path("openingContent").asText())
                    .rewardPerCorrect(new BigDecimal(
                            root.path("rewardPerCorrect").asText("100")))
                    .penaltyPerWrong(new BigDecimal(
                            root.path("penaltyPerWrong").asText("50")))
                    .authorType(AuthorType.AI_GENERATED)
                    .status(StoryStatus.PENDING_REVIEW)
                    .createdAt(LocalDateTime.now())
                    .build();

            story = storyRepository.save(story);

            JsonNode questions = root.path("questions");
            List<CreateStoryRequest.QuestionRequest> questionRequests = new ArrayList<>();

            for (JsonNode q : questions) {
                List<CreateStoryRequest.OptionRequest> optionRequests = new ArrayList<>();
                for (JsonNode o : q.path("options")) {
                    optionRequests.add(new CreateStoryRequest.OptionRequest(
                            o.path("optionText").asText(),
                            o.path("optionOrder").asInt(),
                            o.path("isCorrect").asBoolean(),
                            o.path("reasoningText").asText()));
                }
                questionRequests.add(new CreateStoryRequest.QuestionRequest(
                        q.path("questionText").asText(),
                        q.path("questionOrder").asInt(),
                        optionRequests));
            }

            saveQuestions(story, questionRequests);
            return story;

        } catch (Exception e) {
            log.error("Failed to parse Groq response: {}", e.getMessage());
            throw new BusinessException(
                    "Failed to parse AI response. Please try generating again.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void saveQuestions(
            Story story, List<CreateStoryRequest.QuestionRequest> questionRequests) {
        if (questionRequests == null) return;
        for (int i = 0; i < questionRequests.size(); i++) {
            var qReq = questionRequests.get(i);
            StoryQuestion question = StoryQuestion.builder()
                    .story(story)
                    .questionOrder(qReq.questionOrder() != null ? qReq.questionOrder() : i + 1)
                    .questionText(qReq.questionText())
                    .build();
            question = questionRepository.save(question);

            if (qReq.options() != null) {
                for (int j = 0; j < qReq.options().size(); j++) {
                    var oReq = qReq.options().get(j);
                    optionRepository.save(StoryOption.builder()
                            .question(question)
                            .optionOrder(oReq.optionOrder() != null ? oReq.optionOrder() : j + 1)
                            .optionText(oReq.optionText())
                            .isCorrect(oReq.isCorrect() != null ? oReq.isCorrect() : false)
                            .reasoningText(oReq.reasoningText())
                            .build());
                }
            }
        }
    }

    private Story findById(Long storyId) {
        return storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));
    }

    private Pageable buildPageable(String sortBy, int page) {
        Sort sort = Sort.by("createdAt").descending();
        if ("reward".equalsIgnoreCase(sortBy)) {
            sort = Sort.by("rewardPerCorrect").descending();
        } else if ("title".equalsIgnoreCase(sortBy)) {
            sort = Sort.by("title").ascending();
        }
        return PageRequest.of(Math.max(0, page), PAGE_SIZE, sort);
    }

    private StoryResponse mapToResponse(Story story, Long userId, boolean isAdmin) {
        String playStatus = null;
        if (userId != null) {
            Optional<UserStoryProgress> progress =
                    progressRepository.findByUserIdAndStoryId(userId, story.getId());
            if (progress.isEmpty()) {
                playStatus = "PLAY";
            } else if (progress.get().getCompletedStory()) {
                playStatus = "PLAYED";
            } else {
                playStatus = "RESUME";
            }
        }

        int playedCount = isAdmin
                ? (int) progressRepository.countByStoryId(story.getId())
                : 0;

        List<StoryResponse.QuestionResponse> questions =
                story.getQuestions() == null ? List.of() :
                        story.getQuestions().stream()
                                .map(q -> new StoryResponse.QuestionResponse(
                                        q.getId(),
                                        q.getQuestionOrder(),
                                        q.getQuestionText(),
                                        q.getOptions() == null ? List.of() :
                                                q.getOptions().stream()
                                                        .map(o -> new StoryResponse.OptionResponse(
                                                                o.getId(),
                                                                o.getOptionOrder(),
                                                                o.getOptionText(),
                                                                // Hide correct answer from users during play
                                                                isAdmin ? o.getIsCorrect() : null,
                                                                isAdmin ? o.getReasoningText() : null))
                                                        .collect(Collectors.toList())))
                                .collect(Collectors.toList());

        return new StoryResponse(
                story.getId(),
                story.getTitle(),
                story.getDifficulty(),
                story.getCategory(),
                story.getRewardPerCorrect(),
                story.getPenaltyPerWrong(),
                story.getOpeningContent(),
                story.getAuthorType(),
                story.getStatus(),
                story.getCreatedAt(),
                story.getPublishedAt(),
                questions,
                playStatus,
                isAdmin ? playedCount : null);
    }
}