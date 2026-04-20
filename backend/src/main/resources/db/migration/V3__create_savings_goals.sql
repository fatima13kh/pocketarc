CREATE TABLE savings_goals (
                               id             BIGSERIAL PRIMARY KEY,
                               user_id        BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               name           VARCHAR(255)   NOT NULL,
                               target_amount  DECIMAL(12,2)  NOT NULL,
                               current_amount DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
                               cover_image_url TEXT,
                               category       goal_category,
                               created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
                               updated_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);