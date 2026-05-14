package com.pocketarc.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.pocketarc.dto.request.CreateGoalRequest;
import com.pocketarc.dto.request.UpdateGoalRequest;
import com.pocketarc.dto.response.GoalResponse;
import com.pocketarc.exception.BusinessException;
import com.pocketarc.exception.ResourceNotFoundException;
import com.pocketarc.model.SavingsGoal;
import com.pocketarc.model.User;
import com.pocketarc.model.enums.GoalCategory;
import com.pocketarc.repository.SavingsGoalRepository;
import com.pocketarc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoalService {

    private final SavingsGoalRepository goalRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    @Transactional(readOnly = true)
    public List<GoalResponse> getUserGoals(Long userId) {
        User user = findUserById(userId);
        List<SavingsGoal> goals = goalRepository.findAllByUserId(userId);

        return goals.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GoalResponse getGoal(Long goalId, Long userId) {
        SavingsGoal goal = findGoalById(goalId);

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException("You don't have permission to view this goal");
        }

        return mapToResponse(goal);
    }

    @Transactional
    public GoalResponse createGoal(Long userId, CreateGoalRequest request) {
        User user = findUserById(userId);

        // Validate category
        GoalCategory category;
        try {
            category = GoalCategory.valueOf(request.getCategory().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid category. Please select a valid category.");
        }

        // Upload image to Cloudinary if provided
        String imageUrl = null;
        if (request.getCoverImage() != null && !request.getCoverImage().isEmpty()) {
            imageUrl = uploadImage(request.getCoverImage());
        }

        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .currentAmount(BigDecimal.ZERO)
                .coverImageUrl(imageUrl)
                .category(category)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        goal = goalRepository.save(goal);
        return mapToResponse(goal);
    }

    @Transactional
    public GoalResponse updateGoal(Long goalId, Long userId, UpdateGoalRequest request) {
        SavingsGoal goal = findGoalById(goalId);

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException("You don't have permission to update this goal");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            goal.setName(request.getName());
        }

        if (request.getTargetAmount() != null && request.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            if (request.getTargetAmount().compareTo(goal.getCurrentAmount()) < 0) {
                throw new BusinessException("Target amount cannot be less than current saved amount");
            }
            goal.setTargetAmount(request.getTargetAmount());
        }

        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            try {
                GoalCategory category = GoalCategory.valueOf(request.getCategory().toUpperCase());
                goal.setCategory(category);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Invalid category");
            }
        }

        goal.setUpdatedAt(LocalDateTime.now());
        goal = goalRepository.save(goal);
        return mapToResponse(goal);
    }

    @Transactional
    public void deleteGoal(Long goalId, Long userId) {
        SavingsGoal goal = findGoalById(goalId);

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException("You don't have permission to delete this goal");
        }

        // Return funds to user's cash balance
        User user = goal.getUser();
        if (goal.getCurrentAmount().compareTo(BigDecimal.ZERO) > 0) {
            user.setCashBalance(user.getCashBalance().add(goal.getCurrentAmount()));
            userRepository.save(user);
        }

        goalRepository.delete(goal);
    }

    @Transactional
    public GoalResponse addFunds(Long goalId, Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount must be greater than 0");
        }

        SavingsGoal goal = findGoalById(goalId);

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException("You don't have permission to modify this goal");
        }

        User user = goal.getUser();

        // Check if user has enough cash balance
        if (user.getCashBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient cash balance. You have " + user.getCashBalance() + " BHD available.");
        }

        // Deduct from cash balance
        user.setCashBalance(user.getCashBalance().subtract(amount));
        userRepository.save(user);

        // Add to goal
        BigDecimal newAmount = goal.getCurrentAmount().add(amount);
        goal.setCurrentAmount(newAmount);
        goal.setUpdatedAt(LocalDateTime.now());

        // Check if goal is completed
        if (newAmount.compareTo(goal.getTargetAmount()) >= 0) {
            log.info("Goal '{}' completed by user {}", goal.getName(), userId);
        }

        goal = goalRepository.save(goal);
        return mapToResponse(goal);
    }

    @Transactional
    public GoalResponse withdrawFunds(Long goalId, Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount must be greater than 0");
        }

        SavingsGoal goal = findGoalById(goalId);

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException("You don't have permission to modify this goal");
        }

        // Check if enough funds in goal
        if (goal.getCurrentAmount().compareTo(amount) < 0) {
            throw new BusinessException("Cannot withdraw more than " + goal.getCurrentAmount() + " BHD from this goal");
        }

        User user = goal.getUser();

        // Add to cash balance
        user.setCashBalance(user.getCashBalance().add(amount));
        userRepository.save(user);

        // Deduct from goal
        BigDecimal newAmount = goal.getCurrentAmount().subtract(amount);
        goal.setCurrentAmount(newAmount);
        goal.setUpdatedAt(LocalDateTime.now());

        goal = goalRepository.save(goal);
        return mapToResponse(goal);
    }

    private String uploadImage(MultipartFile file) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "savings_goals",
                            "allowed_formats", List.of("jpg", "jpeg", "png", "webp")
                    )
            );
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary: {}", e.getMessage());
            throw new BusinessException("Failed to upload image. Please try again.");
        }
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SavingsGoal findGoalById(Long goalId) {
        return goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
    }

    private GoalResponse mapToResponse(SavingsGoal goal) {
        return GoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .coverImageUrl(goal.getCoverImageUrl())
                .category(goal.getCategory() != null ? goal.getCategory().name() : null)
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}