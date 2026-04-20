package com.pocketarc.model;

import com.pocketarc.model.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvestmentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type",
            columnDefinition = "transaction_type",
            nullable = false)
    private TransactionType transactionType;

    @Column(nullable = false, precision = 16, scale = 6)
    private BigDecimal shares;

    @Column(name = "price_per_share_bhd", nullable = false, precision = 12, scale = 4)
    private BigDecimal pricePerShareBhd;

    @Column(name = "total_amount_bhd", nullable = false, precision = 12, scale = 4)
    private BigDecimal totalAmountBhd;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate = LocalDateTime.now();
}