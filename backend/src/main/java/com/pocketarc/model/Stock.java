package com.pocketarc.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stocks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String symbol;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(length = 100)
    private String sector;

    @Column(name = "current_price_bhd", precision = 12, scale = 4)
    private BigDecimal currentPriceBhd;

    @Column(name = "change_amount_bhd", precision = 12, scale = 4)
    private BigDecimal changeAmountBhd;

    @Column(name = "change_percentage", precision = 8, scale = 4)
    private BigDecimal changePercentage;

    @Column(name = "day_high_bhd", precision = 12, scale = 4)
    private BigDecimal dayHighBhd;

    @Column(name = "day_low_bhd", precision = 12, scale = 4)
    private BigDecimal dayLowBhd;

    private Long volume;

    @Column(name = "last_price_update")
    private LocalDateTime lastPriceUpdate;
}