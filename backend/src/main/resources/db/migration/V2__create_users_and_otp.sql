CREATE TABLE users (
                       id            BIGSERIAL PRIMARY KEY,
                       username      VARCHAR(50)   NOT NULL UNIQUE,
                       email         VARCHAR(255)  NOT NULL UNIQUE,
                       phone_number  VARCHAR(20),
                       password_hash VARCHAR(255)  NOT NULL,
                       is_admin      BOOLEAN       NOT NULL DEFAULT FALSE,
                       is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
                       cash_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                       created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_codes (
                           id         BIGSERIAL PRIMARY KEY,
                           user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           code       VARCHAR(6)  NOT NULL,
                           expires_at TIMESTAMP   NOT NULL,
                           is_used    BOOLEAN     NOT NULL DEFAULT FALSE,
                           created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_user_id ON otp_codes(user_id);