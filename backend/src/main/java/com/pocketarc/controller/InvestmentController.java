package com.pocketarc.controller;

import com.pocketarc.dto.request.BuyStockRequest;
import com.pocketarc.dto.request.SellStockRequest;
import com.pocketarc.dto.response.HoldingResponse;
import com.pocketarc.dto.response.PortfolioSummaryResponse;
import com.pocketarc.dto.response.StockSearchResponse;
import com.pocketarc.model.Stock;
import com.pocketarc.repository.StockRepository;
import com.pocketarc.security.JwtTokenProvider;
import com.pocketarc.service.ExchangeRateService;
import com.pocketarc.service.InvestmentService;
import com.pocketarc.service.StockMarketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentService investmentService;
    private final StockMarketService stockMarketService;
    private final StockRepository stockRepository;
    private final ExchangeRateService exchangeRateService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    @GetMapping("/search")
    public ResponseEntity<List<StockSearchResponse>> searchStocks(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String query) {
        extractUserId(authHeader);
        return ResponseEntity.ok(stockMarketService.searchStocks(query));
    }

    @GetMapping("/top")
    public ResponseEntity<List<StockSearchResponse>> getTopStocks(
            @RequestHeader("Authorization") String authHeader) {
        extractUserId(authHeader);
        return ResponseEntity.ok(stockMarketService.getPopularStocks());
    }

    @GetMapping("/quote/{symbol}")
    public ResponseEntity<StockSearchResponse> getQuote(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String symbol) {
        extractUserId(authHeader);

        var quote = stockMarketService.getStockQuote(symbol);
        if (quote == null) {
            return ResponseEntity.notFound().build();
        }

        // Get stock info from database
        Stock stock = stockRepository.findBySymbol(symbol.toUpperCase()).orElse(null);

        BigDecimal priceBhd = exchangeRateService.convertUsdToBhd(quote.price());
        String companyName = stock != null ? stock.getCompanyName() : symbol;
        String sector = stock != null ? stock.getSector() : "";

        StockSearchResponse response = new StockSearchResponse(
                symbol.toUpperCase(),
                companyName,
                quote.price(),
                priceBhd,
                quote.change(),
                quote.changePercent(),
                sector
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{symbol}")
    public ResponseEntity<List<Map<String, Object>>> getStockHistory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String symbol) {
        extractUserId(authHeader);
        return ResponseEntity.ok(stockMarketService.getStockHistory(symbol));
    }

    @PostMapping("/buy")
    public ResponseEntity<HoldingResponse> buyStock(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody BuyStockRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(investmentService.buyStock(userId, request));
    }

    @PostMapping("/sell")
    public ResponseEntity<Map<String, Object>> sellStock(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody SellStockRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(investmentService.sellStock(userId, request));
    }

    @GetMapping("/portfolio")
    public ResponseEntity<PortfolioSummaryResponse> getPortfolio(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(investmentService.getPortfolio(userId));
    }

    @GetMapping("/holdings")
    public ResponseEntity<List<HoldingResponse>> getHoldings(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(investmentService.getHoldings(userId));
    }
}