package com.pocketarc.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "stock_price_history",
        uniqueConstraints = @UniqueConstraint(columnNames = {"stock_id", "date"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "open_price_bhd", precision = 12, scale = 4)
    private BigDecimal openPriceBhd;

    @Column(name = "high_price_bhd", precision = 12, scale = 4)
    private BigDecimal highPriceBhd;

    @Column(name = "low_price_bhd", precision = 12, scale = 4)
    private BigDecimal lowPriceBhd;

    @Column(name = "close_price_bhd", nullable = false, precision = 12, scale = 4)
    private BigDecimal closePriceBhd;

    private Long volume;
}