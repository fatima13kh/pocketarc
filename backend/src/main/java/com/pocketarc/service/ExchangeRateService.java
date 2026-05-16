package com.pocketarc.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class ExchangeRateService {

    // Fixed exchange rate: 1 USD = 0.376 BHD (official Bahraini rate)
    private static final BigDecimal USD_TO_BHD = new BigDecimal("0.376");

    public BigDecimal getUsdToBhdRate() {
        return USD_TO_BHD;
    }

    public BigDecimal convertUsdToBhd(BigDecimal usdAmount) {
        return usdAmount.multiply(USD_TO_BHD).setScale(4, RoundingMode.HALF_UP);
    }

    public BigDecimal convertBhdToUsd(BigDecimal bhdAmount) {
        return bhdAmount.divide(USD_TO_BHD, 4, RoundingMode.HALF_UP);
    }
}