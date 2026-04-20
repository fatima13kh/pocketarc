package com.pocketarc.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_rate_cache")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExchangeRateCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usd_to_bhd", nullable = false, precision = 12, scale = 6)
    private BigDecimal usdToBhd;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated = LocalDateTime.now();
}