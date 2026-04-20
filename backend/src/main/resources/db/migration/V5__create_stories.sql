CREATE TABLE stories (
                         id                BIGSERIAL PRIMARY KEY,
                         title             VARCHAR(255)     NOT NULL,
                         difficulty        difficulty_level NOT NULL,
                         category          story_category   NOT NULL,
                         reward_per_correct DECIMAL(10,2)   NOT NULL DEFAULT 0,
                         penalty_per_wrong  DECIMAL(10,2)   NOT NULL DEFAULT 0,
                         opening_content   TEXT,
                         author_type       author_type      NOT NULL,
                         status            story_status     NOT NULL,
                         created_at        TIMESTAMP        NOT NULL DEFAULT NOW(),
                         published_at      TIMESTAMP
);

CREATE TABLE story_questions (
                                 id             BIGSERIAL PRIMARY KEY,
                                 story_id       BIGINT   NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                                 question_order INTEGER  NOT NULL,
                                 question_text  TEXT     NOT NULL
);

CREATE TABLE story_options (
                               id             BIGSERIAL PRIMARY KEY,
                               question_id    BIGINT   NOT NULL REFERENCES story_questions(id) ON DELETE CASCADE,
                               option_order   INTEGER  NOT NULL,
                               option_text    TEXT     NOT NULL,
                               is_correct     BOOLEAN  NOT NULL DEFAULT FALSE,
                               reasoning_text TEXT
);

CREATE TABLE user_story_progress (
                                     id                   BIGSERIAL PRIMARY KEY,
                                     user_id              BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                     story_id             BIGINT        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                                     completed_story      BOOLEAN       NOT NULL DEFAULT FALSE,
                                     total_reward_claimed DECIMAL(10,2) NOT NULL DEFAULT 0,
                                     completed_at         TIMESTAMP,
                                     UNIQUE(user_id, story_id)
);

CREATE TABLE user_question_responses (
                                         id                  BIGSERIAL PRIMARY KEY,
                                         progress_id         BIGINT        NOT NULL REFERENCES user_story_progress(id) ON DELETE CASCADE,
                                         question_id         BIGINT        NOT NULL REFERENCES story_questions(id),
                                         selected_option_id  BIGINT        NOT NULL REFERENCES story_options(id),
                                         cash_effect_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
                                         answered_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
                                         UNIQUE(progress_id, question_id)
);

CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_user_story_progress_user ON user_story_progress(user_id);