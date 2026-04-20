CREATE TABLE stocks (
                        id                BIGSERIAL PRIMARY KEY,
                        symbol            VARCHAR(10)   NOT NULL UNIQUE,
                        company_name      VARCHAR(255)  NOT NULL,
                        sector            VARCHAR(100),
                        current_price_bhd DECIMAL(12,4),
                        change_amount_bhd DECIMAL(12,4),
                        change_percentage DECIMAL(8,4),
                        day_high_bhd      DECIMAL(12,4),
                        day_low_bhd       DECIMAL(12,4),
                        volume            BIGINT,
                        last_price_update TIMESTAMP
);

CREATE TABLE stock_price_history (
                                     id              BIGSERIAL PRIMARY KEY,
                                     stock_id        BIGINT        NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
                                     date            DATE          NOT NULL,
                                     open_price_bhd  DECIMAL(12,4),
                                     high_price_bhd  DECIMAL(12,4),
                                     low_price_bhd   DECIMAL(12,4),
                                     close_price_bhd DECIMAL(12,4) NOT NULL,
                                     volume          BIGINT,
                                     UNIQUE(stock_id, date)
);

CREATE TABLE exchange_rate_cache (
                                     id           BIGSERIAL PRIMARY KEY,
                                     usd_to_bhd   DECIMAL(12,6) NOT NULL,
                                     last_updated TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE investment_transactions (
                                         id                  BIGSERIAL PRIMARY KEY,
                                         user_id             BIGINT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                         stock_id            BIGINT           NOT NULL REFERENCES stocks(id),
                                         transaction_type    transaction_type NOT NULL,
                                         shares              DECIMAL(16,6)    NOT NULL,
                                         price_per_share_bhd DECIMAL(12,4)    NOT NULL,
                                         total_amount_bhd    DECIMAL(12,4)    NOT NULL,
                                         transaction_date    TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX idx_transactions_stock_id ON investment_transactions(stock_id);