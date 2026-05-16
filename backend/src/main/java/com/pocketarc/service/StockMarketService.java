package com.pocketarc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pocketarc.dto.response.StockSearchResponse;
import com.pocketarc.model.Stock;
import com.pocketarc.model.StockPriceHistory;
import com.pocketarc.repository.StockPriceHistoryRepository;
import com.pocketarc.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockMarketService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExchangeRateService exchangeRateService;
    private final StockRepository stockRepository;
    private final StockPriceHistoryRepository historyRepository;

    @Value("${twelve-data.api-key}")
    private String apiKey;

    private static final String TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";

    // Target: 20 stocks
    private static final int TARGET_STOCK_COUNT = 20;

    // Large pool of symbols to try
    private static final List<String> SYMBOL_POOL = List.of(
            "AAPL", "MSFT", "NVDA", "INTC", "GOOGL", "META", "NFLX", "AMZN",
            "TSLA", "V", "JNJ", "UNH", "WMT", "XOM", "PLD", "KO", "PG", "HD",
            "DIS", "NKE", "CRM", "ABT", "PEP", "CSCO", "ADBE", "IBM", "AMD",
            "BA", "CAT", "GS", "JPM", "C", "WFC", "MS", "BAC", "PFE", "MRK",
            "T", "VZ", "NEE", "NOK", "ERIC", "SNE", "TM", "HMC"
    );

    private final Map<String, CachedStockPrice> priceCache = new ConcurrentHashMap<>();
    private final Map<String, Boolean> isMockStock = new ConcurrentHashMap<>();
    private static final int CACHE_DURATION_HOURS = 2;
    private static final Random random = new Random();

    private record CachedStockPrice(BigDecimal price, BigDecimal change, BigDecimal changePercent, LocalDateTime cachedAt) {}

    public record QuoteData(BigDecimal price, BigDecimal change, BigDecimal changePercent) {}

    // ==================== INITIAL DATA POPULATION ====================

    public List<StockSearchResponse> fetchAndSavePopularStocks() {
        List<StockSearchResponse> results = new ArrayList<>();
        List<String> selectedSymbols = new ArrayList<>();

        log.info("Attempting to fetch {} stocks from API...", TARGET_STOCK_COUNT);

        for (String symbol : SYMBOL_POOL) {
            if (selectedSymbols.size() >= TARGET_STOCK_COUNT) break;

            boolean isReal = tryFetchStock(symbol, results);
            if (isReal) {
                selectedSymbols.add(symbol);
                log.info("✅ Added REAL stock: {}", symbol);
            } else {
                // Add with mock data
                createMockStock(symbol, results);
                selectedSymbols.add(symbol);
                log.info("🔄 Added MOCK stock: {}", symbol);
            }
        }

        long realCount = results.stream().filter(s -> !isMockStock.containsKey(s.symbol())).count();
        long mockCount = results.stream().filter(s -> isMockStock.containsKey(s.symbol())).count();

        log.info("Successfully initialized {} stocks ({} real, {} mock)",
                results.size(), realCount, mockCount);

        return results;
    }

    private boolean tryFetchStock(String symbol, List<StockSearchResponse> results) {
        try {
            // Try quote
            String quoteUrl = String.format("%s/quote?symbol=%s&apikey=%s",
                    TWELVE_DATA_BASE_URL, symbol, apiKey);
            String quoteResponse = restTemplate.getForObject(quoteUrl, String.class);
            JsonNode quoteJson = objectMapper.readTree(quoteResponse);

            if (quoteJson.has("close") && !quoteJson.path("close").asText().isEmpty()) {
                BigDecimal priceUsd = new BigDecimal(quoteJson.path("close").asText());
                BigDecimal priceBhd = exchangeRateService.convertUsdToBhd(priceUsd);
                BigDecimal changeUsd = new BigDecimal(quoteJson.path("change").asText());
                BigDecimal changePercent = new BigDecimal(quoteJson.path("percent_change").asText());

                Stock stock = Stock.builder()
                        .symbol(symbol)
                        .companyName(getCompanyName(symbol))
                        .sector(getSectorForSymbol(symbol))
                        .currentPriceBhd(priceBhd)
                        .changeAmountBhd(changeUsd)
                        .changePercentage(changePercent)
                        .lastPriceUpdate(LocalDateTime.now())
                        .build();
                stockRepository.save(stock);

                fetchAndSaveHistory(symbol, stock);
                isMockStock.remove(symbol);

                results.add(new StockSearchResponse(
                        symbol, getCompanyName(symbol), priceUsd, priceBhd,
                        changeUsd, changePercent, getSectorForSymbol(symbol)
                ));

                return true;
            }
        } catch (Exception e) {
            log.debug("Failed to fetch real data for {}: {}", symbol, e.getMessage());
        }
        return false;
    }

    private void createMockStock(String symbol, List<StockSearchResponse> results) {
        BigDecimal priceUsd = generateRealisticPrice(symbol);
        BigDecimal priceBhd = exchangeRateService.convertUsdToBhd(priceUsd);
        BigDecimal changePercent = new BigDecimal(random.nextInt(1000) - 500).divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        BigDecimal changeUsd = priceUsd.multiply(changePercent).divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);

        Stock stock = Stock.builder()
                .symbol(symbol)
                .companyName(getCompanyName(symbol))
                .sector(getSectorForSymbol(symbol))
                .currentPriceBhd(priceBhd)
                .changeAmountBhd(changeUsd)
                .changePercentage(changePercent)
                .lastPriceUpdate(LocalDateTime.now())
                .build();
        stockRepository.save(stock);

        // Generate mock history
        generateMockHistory(symbol, stock);
        isMockStock.put(symbol, true);

        results.add(new StockSearchResponse(
                symbol, getCompanyName(symbol), priceUsd, priceBhd,
                changeUsd, changePercent, getSectorForSymbol(symbol)
        ));
    }

    private BigDecimal generateRealisticPrice(String symbol) {
        String sector = getSectorForSymbol(symbol);
        return switch (sector) {
            case "Technology" -> new BigDecimal(150 + random.nextInt(350));
            case "Communication Services" -> new BigDecimal(100 + random.nextInt(200));
            case "Consumer Cyclical" -> new BigDecimal(80 + random.nextInt(170));
            case "Automotive" -> new BigDecimal(100 + random.nextInt(200));
            case "Financial Services" -> new BigDecimal(50 + random.nextInt(100));
            case "Healthcare" -> new BigDecimal(80 + random.nextInt(120));
            case "Consumer Defensive" -> new BigDecimal(60 + random.nextInt(80));
            case "Energy" -> new BigDecimal(40 + random.nextInt(60));
            case "Real Estate" -> new BigDecimal(60 + random.nextInt(80));
            default -> new BigDecimal(100 + random.nextInt(200));
        };
    }

    private void fetchAndSaveHistory(String symbol, Stock stock) {
        try {
            String url = String.format("%s/time_series?symbol=%s&interval=1day&outputsize=30&apikey=%s",
                    TWELVE_DATA_BASE_URL, symbol, apiKey);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode json = objectMapper.readTree(response);

            if (json.has("values")) {
                int count = 0;
                for (JsonNode item : json.path("values")) {
                    LocalDate date = LocalDate.parse(item.path("datetime").asText());
                    BigDecimal closeUsd = new BigDecimal(item.path("close").asText());
                    BigDecimal closeBhd = exchangeRateService.convertUsdToBhd(closeUsd);

                    StockPriceHistory historyPoint = StockPriceHistory.builder()
                            .stock(stock)
                            .date(date)
                            .closePriceBhd(closeBhd)
                            .build();
                    historyRepository.save(historyPoint);
                    count++;
                }
                log.debug("Saved {} history points for {}", count, symbol);
            }
        } catch (Exception e) {
            log.debug("Could not fetch history for {}, will use mock", symbol);
            generateMockHistory(symbol, stock);
        }
    }

    private void generateMockHistory(String symbol, Stock stock) {
        BigDecimal basePrice = stock.getCurrentPriceBhd();
        LocalDate date = LocalDate.now().minusDays(30);

        for (int i = 0; i <= 30; i++) {
            BigDecimal variation = new BigDecimal(random.nextInt(20) - 10);
            BigDecimal price = basePrice.add(variation);
            if (price.compareTo(BigDecimal.ZERO) < 0) price = BigDecimal.ONE;

            StockPriceHistory historyPoint = StockPriceHistory.builder()
                    .stock(stock)
                    .date(date.plusDays(i))
                    .closePriceBhd(price)
                    .build();
            historyRepository.save(historyPoint);
        }
        log.debug("Generated mock history for {}", symbol);
    }

    // ==================== PRICE UPDATE EVERY 2 HOURS ====================

    @Scheduled(fixedDelay = 2, timeUnit = TimeUnit.HOURS)
    public void updateAllStockPrices() {
        log.info("Starting scheduled price update for all stocks");
        List<Stock> allStocks = stockRepository.findAll();
        int updatedCount = 0;
        int realCount = 0;
        int mockCount = 0;

        for (Stock stock : allStocks) {
            try {
                // Try to get real price from API
                String url = String.format("%s/quote?symbol=%s&apikey=%s",
                        TWELVE_DATA_BASE_URL, stock.getSymbol(), apiKey);
                String response = restTemplate.getForObject(url, String.class);
                JsonNode json = objectMapper.readTree(response);

                BigDecimal priceBhd;
                BigDecimal changeUsd;
                BigDecimal changePercent;
                boolean isReal = false;

                if (json.has("close") && !json.path("close").asText().isEmpty()) {
                    BigDecimal priceUsd = new BigDecimal(json.path("close").asText());
                    priceBhd = exchangeRateService.convertUsdToBhd(priceUsd);
                    changeUsd = new BigDecimal(json.path("change").asText());
                    changePercent = new BigDecimal(json.path("percent_change").asText());
                    isReal = true;
                    realCount++;
                } else {
                    // Generate mock price movement (random walk)
                    BigDecimal currentPrice = stock.getCurrentPriceBhd();
                    double changeRatio = (random.nextDouble() * 0.06) - 0.03; // -3% to +3%
                    priceBhd = currentPrice.multiply(BigDecimal.valueOf(1 + changeRatio));
                    if (priceBhd.compareTo(BigDecimal.ZERO) < 0) priceBhd = BigDecimal.ONE;
                    changePercent = BigDecimal.valueOf(changeRatio * 100);
                    changeUsd = priceBhd.multiply(changePercent).divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
                    mockCount++;
                }

                stock.setCurrentPriceBhd(priceBhd);
                stock.setChangeAmountBhd(changeUsd);
                stock.setChangePercentage(changePercent);
                stock.setLastPriceUpdate(LocalDateTime.now());
                stockRepository.save(stock);

                updatedCount++;
                log.debug("Updated {} for {}: {} BHD ({}%)",
                        isReal ? "REAL" : "MOCK", stock.getSymbol(), priceBhd, changePercent);

            } catch (Exception e) {
                log.error("Failed to update price for {}: {}", stock.getSymbol(), e.getMessage());
            }
        }
        log.info("Completed price update - updated {} stocks ({} real, {} mock)", updatedCount, realCount, mockCount);
    }

    // ==================== SERVE FROM DATABASE ====================

    public List<StockSearchResponse> searchStocks(String query) {
        List<Stock> dbStocks = stockRepository.findAllByOrderBySymbolAsc();
        List<StockSearchResponse> results = new ArrayList<>();

        for (Stock stock : dbStocks) {
            results.add(new StockSearchResponse(
                    stock.getSymbol(),
                    stock.getCompanyName(),
                    exchangeRateService.convertBhdToUsd(stock.getCurrentPriceBhd()),
                    stock.getCurrentPriceBhd(),
                    stock.getChangeAmountBhd(),
                    stock.getChangePercentage(),
                    stock.getSector()
            ));
        }
        return results;
    }

    public QuoteData getStockQuote(String symbol) {
        Stock stock = stockRepository.findBySymbol(symbol).orElse(null);
        if (stock != null && stock.getCurrentPriceBhd() != null) {
            BigDecimal priceUsd = exchangeRateService.convertBhdToUsd(stock.getCurrentPriceBhd());
            return new QuoteData(priceUsd, stock.getChangeAmountBhd(), stock.getChangePercentage());
        }
        return null;
    }

    public List<Map<String, Object>> getStockHistory(String symbol) {
        Stock stock = stockRepository.findBySymbol(symbol).orElse(null);
        if (stock == null) return Collections.emptyList();

        List<StockPriceHistory> dbHistory = historyRepository.findAllByStockIdOrderByDateAsc(stock.getId());
        List<Map<String, Object>> history = new ArrayList<>();

        for (StockPriceHistory hp : dbHistory) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", hp.getDate().toString());
            point.put("close", hp.getClosePriceBhd());
            point.put("open", hp.getOpenPriceBhd() != null ? hp.getOpenPriceBhd() : hp.getClosePriceBhd());
            point.put("high", hp.getHighPriceBhd() != null ? hp.getHighPriceBhd() : hp.getClosePriceBhd());
            point.put("low", hp.getLowPriceBhd() != null ? hp.getLowPriceBhd() : hp.getClosePriceBhd());
            history.add(point);
        }
        return history;
    }

    public List<StockSearchResponse> getPopularStocks() {
        return searchStocks(null);
    }

    public List<StockSearchResponse> getTopStocks() {
        return getPopularStocks();
    }

    // ==================== HELPER METHODS ====================

    private String getCompanyName(String symbol) {
        Map<String, String> companyNames = new HashMap<>();
        companyNames.put("AAPL", "Apple Inc.");
        companyNames.put("MSFT", "Microsoft Corporation");
        companyNames.put("NVDA", "NVIDIA Corporation");
        companyNames.put("INTC", "Intel Corporation");
        companyNames.put("GOOGL", "Alphabet Inc. (Google)");
        companyNames.put("META", "Meta Platforms, Inc. (Facebook)");
        companyNames.put("NFLX", "Netflix Inc.");
        companyNames.put("AMZN", "Amazon.com Inc.");
        companyNames.put("TSLA", "Tesla, Inc.");
        companyNames.put("V", "Visa Inc.");
        companyNames.put("JNJ", "Johnson & Johnson");
        companyNames.put("UNH", "UnitedHealth Group Inc.");
        companyNames.put("WMT", "Walmart Inc.");
        companyNames.put("XOM", "Exxon Mobil Corporation");
        companyNames.put("PLD", "Prologis, Inc.");
        companyNames.put("KO", "The Coca-Cola Company");
        companyNames.put("PG", "Procter & Gamble Co.");
        companyNames.put("HD", "Home Depot Inc.");
        companyNames.put("DIS", "The Walt Disney Company");
        companyNames.put("NKE", "Nike Inc.");
        companyNames.put("CRM", "Salesforce Inc.");
        companyNames.put("ABT", "Abbott Laboratories");
        companyNames.put("PEP", "PepsiCo Inc.");
        companyNames.put("CSCO", "Cisco Systems Inc.");
        companyNames.put("ADBE", "Adobe Inc.");
        companyNames.put("IBM", "IBM Corp.");
        companyNames.put("AMD", "Advanced Micro Devices Inc.");
        companyNames.put("BA", "Boeing Co.");
        companyNames.put("CAT", "Caterpillar Inc.");
        companyNames.put("GS", "Goldman Sachs Group Inc.");
        companyNames.put("JPM", "JPMorgan Chase & Co.");
        companyNames.put("C", "Citigroup Inc.");
        companyNames.put("WFC", "Wells Fargo & Co.");
        companyNames.put("MS", "Morgan Stanley");
        companyNames.put("BAC", "Bank of America Corp.");
        companyNames.put("PFE", "Pfizer Inc.");
        companyNames.put("MRK", "Merck & Co.");
        companyNames.put("T", "AT&T Inc.");
        companyNames.put("VZ", "Verizon Communications Inc.");
        companyNames.put("NEE", "NextEra Energy Inc.");
        companyNames.put("NOK", "Nokia Corp.");
        companyNames.put("ERIC", "Ericsson");
        companyNames.put("SNE", "Sony Group Corp.");
        companyNames.put("TM", "Toyota Motor Corp.");
        companyNames.put("HMC", "Honda Motor Co.");
        return companyNames.getOrDefault(symbol, symbol);
    }

    private String getSectorForSymbol(String symbol) {
        Map<String, String> sectors = new HashMap<>();
        sectors.put("AAPL", "Technology");
        sectors.put("MSFT", "Technology");
        sectors.put("NVDA", "Technology");
        sectors.put("INTC", "Technology");
        sectors.put("GOOGL", "Communication Services");
        sectors.put("META", "Communication Services");
        sectors.put("NFLX", "Communication Services");
        sectors.put("AMZN", "Consumer Cyclical");
        sectors.put("TSLA", "Automotive");
        sectors.put("V", "Financial Services");
        sectors.put("JNJ", "Healthcare");
        sectors.put("UNH", "Healthcare");
        sectors.put("WMT", "Consumer Defensive");
        sectors.put("XOM", "Energy");
        sectors.put("PLD", "Real Estate");
        sectors.put("KO", "Consumer Defensive");
        sectors.put("PG", "Consumer Defensive");
        sectors.put("HD", "Consumer Cyclical");
        sectors.put("DIS", "Communication Services");
        sectors.put("NKE", "Consumer Cyclical");
        sectors.put("CRM", "Technology");
        sectors.put("ABT", "Healthcare");
        sectors.put("PEP", "Consumer Defensive");
        sectors.put("CSCO", "Technology");
        sectors.put("ADBE", "Technology");
        sectors.put("IBM", "Technology");
        sectors.put("AMD", "Technology");
        sectors.put("BA", "Industrials");
        sectors.put("CAT", "Industrials");
        sectors.put("GS", "Financial Services");
        sectors.put("JPM", "Financial Services");
        sectors.put("C", "Financial Services");
        sectors.put("WFC", "Financial Services");
        sectors.put("MS", "Financial Services");
        sectors.put("BAC", "Financial Services");
        sectors.put("PFE", "Healthcare");
        sectors.put("MRK", "Healthcare");
        sectors.put("T", "Communication Services");
        sectors.put("VZ", "Communication Services");
        sectors.put("NEE", "Utilities");
        sectors.put("NOK", "Technology");
        sectors.put("ERIC", "Technology");
        sectors.put("SNE", "Technology");
        sectors.put("TM", "Automotive");
        sectors.put("HMC", "Automotive");
        return sectors.getOrDefault(symbol, "General");
    }
}