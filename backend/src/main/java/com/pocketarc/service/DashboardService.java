package com.pocketarc.service;

import com.pocketarc.dto.response.DashboardSummaryResponse;
import com.pocketarc.dto.response.HoldingResponse;
import com.pocketarc.model.SavingsGoal;
import com.pocketarc.model.User;
import com.pocketarc.repository.SavingsGoalRepository;
import com.pocketarc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final InvestmentService investmentService;

    public DashboardSummaryResponse getDashboardSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal cashBalance = user.getCashBalance();

        // Calculate total goal savings
        List<SavingsGoal> goals = savingsGoalRepository.findAllByUserId(userId);
        BigDecimal totalGoalSavings = goals.stream()
                .map(SavingsGoal::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get portfolio summary
        var portfolio = investmentService.getPortfolio(userId);
        BigDecimal totalInvestmentValue = portfolio.totalValueBhd();
        BigDecimal totalProfitLoss = portfolio.totalProfitLossBhd();
        BigDecimal totalProfitLossPercent = portfolio.totalProfitLossPercent();

        // Calculate total net worth
        BigDecimal totalNetWorth = cashBalance.add(totalGoalSavings).add(totalInvestmentValue);

        // Get recent holdings (top 5)
        List<HoldingResponse> recentHoldings = portfolio.holdings().stream()
                .limit(5)
                .collect(Collectors.toList());

        // Generate net worth history for last 30 days
        Map<String, BigDecimal> netWorthHistory = generateNetWorthHistory(totalNetWorth);

        return new DashboardSummaryResponse(
                cashBalance,
                totalGoalSavings,
                totalInvestmentValue,
                totalNetWorth,
                totalProfitLoss,
                totalProfitLossPercent,
                recentHoldings,
                netWorthHistory
        );
    }

    private Map<String, BigDecimal> generateNetWorthHistory(BigDecimal currentNetWorth) {
        Map<String, BigDecimal> history = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();

        // Generate last 30 days of data with some simulated variation
        // In production, this would come from actual historical data
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            // Simple simulation - in real implementation, this would be from database
            BigDecimal variation = BigDecimal.valueOf(Math.sin(i) * 50);
            BigDecimal netWorth = currentNetWorth.add(variation);
            history.put(date.toString(), netWorth);
        }

        return history;
    }
}