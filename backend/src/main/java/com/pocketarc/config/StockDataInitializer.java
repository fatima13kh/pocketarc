package com.pocketarc.config;

import com.pocketarc.repository.StockRepository;
import com.pocketarc.service.StockMarketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockDataInitializer implements CommandLineRunner {

    private final StockRepository stockRepository;
    private final StockMarketService stockMarketService;

    @Override
    public void run(String... args) throws Exception {
        // Only fetch if database is empty
        if (stockRepository.count() == 0) {
            log.info("========================================");
            log.info("No stocks found in database.");
            log.info("Initializing with up to 20 stocks...");
            log.info("========================================");

            // This method will:
            // 1. Try to get real data from Twelve Data API
            // 2. For any stocks that fail, generate realistic mock data
            // 3. Save all to database
            var stocks = stockMarketService.fetchAndSavePopularStocks();

            log.info("========================================");
            log.info("Successfully initialized {} stocks in database", stocks.size());
            log.info("Background price updates will run every 2 hours automatically");
            log.info("========================================");
        } else {
            log.info("Database already has {} stocks", stockRepository.count());
            log.info("Background price updates will continue to run every 2 hours");
        }
    }
}