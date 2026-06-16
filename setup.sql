-- Run this once in your Neon project's SQL editor to set up the progress table.

CREATE TABLE IF NOT EXISTS user_progress (
  user_email       TEXT        PRIMARY KEY,
  lesson_completions JSONB     NOT NULL DEFAULT '[]'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
