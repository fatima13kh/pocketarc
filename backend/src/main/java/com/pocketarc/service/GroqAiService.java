package com.pocketarc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pocketarc.dto.request.CreateStoryRequest;
import com.pocketarc.dto.request.GenerateStoryRequest;
import com.pocketarc.exception.BusinessException;
import com.pocketarc.model.*;
import com.pocketarc.model.enums.AuthorType;
import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import com.pocketarc.model.enums.StoryStatus;
import com.pocketarc.repository.StoryOptionRepository;
import com.pocketarc.repository.StoryQuestionRepository;
import com.pocketarc.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqAiService {

    private final StoryRepository storyRepository;
    private final StoryQuestionRepository questionRepository;
    private final StoryOptionRepository optionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api-key}")
    private String groqApiKey;

    @Transactional
    public Story generateStory(GenerateStoryRequest request) {
        int numberOfQuestions = request.numberOfQuestions() != null ? request.numberOfQuestions() : 2;
        String prompt = buildGroqPrompt(request.difficulty(), request.category(), numberOfQuestions);
        String groqResponse = callGroqApi(prompt);
        return parseAndSaveGroqStory(groqResponse, request.difficulty(), request.category());
    }

    private String buildGroqPrompt(DifficultyLevel difficulty, StoryCategory category, int numberOfQuestions) {
        StringBuilder questionsTemplate = new StringBuilder();
        for (int i = 1; i <= numberOfQuestions; i++) {
            questionsTemplate.append("""
                    {
                      "questionOrder": %d,
                      "questionText": "Question text here",
                      "options": [
                        {
                          "optionOrder": 1,
                          "optionText": "Option text",
                          "isCorrect": false,
                          "reasoningText": "Explanation why this is wrong"
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
                    },""".formatted(i));
        }
        // Remove trailing comma
        if (questionsTemplate.length() > 0 && questionsTemplate.charAt(questionsTemplate.length() - 1) == ',') {
            questionsTemplate.setLength(questionsTemplate.length() - 1);
        }

        return String.format("""
            You are a financial literacy expert. Create an investment story for educational purposes.
            
            Requirements:
            - Difficulty: %s
            - Category: %s
            - The story must be realistic, educational and professionally written
            - Include exactly %d questions per story
            - Each question must have exactly 3 choices
            - One choice per question must be correct
            - Include clear financial reasoning for each choice
            - IMPORTANT: All monetary values MUST be in Bahraini Dinar (BHD) only. Use "BHD" as the currency.
            - Do NOT use USD, dollars, or any other currency. Only use BHD.
            
            Respond ONLY with valid JSON in this exact format. Do not include any text before or after the JSON.
            
            {
              "title": "Story title here",
              "openingContent": "Brief story context here (use BHD for any money amounts)",
              "rewardPerCorrect": 200,
              "penaltyPerWrong": 100,
              "questions": [
                %s
              ]
            }
            """, difficulty.name(), category.name(), numberOfQuestions, questionsTemplate.toString());
    }

    private String callGroqApi(String prompt) {
        try {
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(60, TimeUnit.SECONDS)
                    .writeTimeout(60, TimeUnit.SECONDS)
                    .readTimeout(120, TimeUnit.SECONDS)
                    .build();

            String requestBody = String.format("""
                {
                  "model": "llama-3.1-8b-instant",
                  "messages": [
                    {"role": "user", "content": %s}
                  ],
                  "temperature": 0.7,
                  "max_tokens": 4000
                }
                """, objectMapper.writeValueAsString(prompt));

            Request request = new Request.Builder()
                    .url("https://api.groq.com/openai/v1/chat/completions")
                    .addHeader("Authorization", "Bearer " + groqApiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(requestBody, MediaType.get("application/json")))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                    log.error("Groq API error response: {}", errorBody);
                    throw new BusinessException("AI generation failed. Please try again.");
                }
                String body = response.body().string();
                JsonNode node = objectMapper.readTree(body);
                return node.path("choices").get(0).path("message").path("content").asText();
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage());
            throw new BusinessException("AI generation failed. Please try again.");
        }
    }

    private String cleanJsonResponse(String rawResponse) {
        String cleaned = rawResponse.replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return cleaned.substring(firstBrace, lastBrace + 1);
        }
        return cleaned;
    }

    private void saveQuestionsToStory(Story story, List<CreateStoryRequest.QuestionRequest> questionRequests) {
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

    private Story parseAndSaveGroqStory(String json, DifficultyLevel difficulty, StoryCategory category) {
        try {
            log.info("Raw Groq response: {}", json);

            String cleaned = cleanJsonResponse(json);
            log.info("Cleaned JSON: {}", cleaned);

            JsonNode root = objectMapper.readTree(cleaned);

            if (!root.has("title") || root.path("title").asText().isEmpty()) {
                throw new BusinessException("AI response missing required field: title");
            }
            if (!root.has("questions") || !root.path("questions").isArray()) {
                throw new BusinessException("AI response missing required field: questions");
            }

            Story story = Story.builder()
                    .title(root.path("title").asText())
                    .difficulty(difficulty)
                    .category(category)
                    .openingContent(root.path("openingContent").asText())
                    .rewardPerCorrect(new BigDecimal(root.path("rewardPerCorrect").asText("100")))
                    .penaltyPerWrong(new BigDecimal(root.path("penaltyPerWrong").asText("50")))
                    .authorType(AuthorType.AI_GENERATED)
                    .status(StoryStatus.PENDING_REVIEW)
                    .createdAt(LocalDateTime.now())
                    .build();

            story = storyRepository.save(story);

            JsonNode questions = root.path("questions");
            List<CreateStoryRequest.QuestionRequest> questionRequests = new ArrayList<>();

            for (JsonNode q : questions) {
                if (!q.has("questionText")) {
                    continue;
                }
                List<CreateStoryRequest.OptionRequest> optionRequests = new ArrayList<>();
                JsonNode options = q.path("options");
                int optionOrder = 1;
                for (JsonNode o : options) {
                    optionRequests.add(new CreateStoryRequest.OptionRequest(
                            o.path("optionText").asText(),
                            o.path("optionOrder").asInt(optionOrder),
                            o.path("isCorrect").asBoolean(),
                            o.path("reasoningText").asText()));
                    optionOrder++;
                }
                questionRequests.add(new CreateStoryRequest.QuestionRequest(
                        q.path("questionText").asText(),
                        q.path("questionOrder").asInt(),
                        optionRequests));
            }

            saveQuestionsToStory(story, questionRequests);
            return story;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Groq response: {}", e.getMessage());
            log.error("Raw response was: {}", json);
            throw new BusinessException("Failed to parse AI response. Please try generating again.");
        }
    }
}