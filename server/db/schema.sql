CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  started_at BIGINT NOT NULL,
  ended_at BIGINT NOT NULL,
  duration_seconds INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_subject_id ON sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
