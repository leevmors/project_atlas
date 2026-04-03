-- Project Atlas | Lingua HQ Leaderboard - Database Initialization
-- Run this script once on a fresh PostgreSQL database.
-- All statements use IF NOT EXISTS so it is safe to re-run.

CREATE TABLE IF NOT EXISTS admins (
  id            serial        PRIMARY KEY,
  username      varchar(255)  UNIQUE NOT NULL,
  password_hash varchar(255)  NOT NULL,
  created_at    timestamptz   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  varchar(255)  UNIQUE NOT NULL,
  password_hash varchar(255)  NOT NULL,
  instagram     varchar(255),
  threads       varchar(255),
  group_number  varchar(20),
  email         varchar(255)  NOT NULL,
  members       jsonb         NOT NULL DEFAULT '[]',
  created_at    timestamptz   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type   varchar(20)   NOT NULL,
  user_id     varchar(255)  NOT NULL,
  user_name   varchar(255)  NOT NULL,
  expires_at  timestamptz   NOT NULL,
  created_at  timestamptz   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS task_scores (
  id          serial        PRIMARY KEY,
  team_id     uuid          NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  task_name   varchar(255)  NOT NULL,
  accuracy    integer       NOT NULL DEFAULT 0 CHECK (accuracy BETWEEN 0 AND 10),
  quality     integer       NOT NULL DEFAULT 0 CHECK (quality BETWEEN 0 AND 10),
  speed       integer       NOT NULL DEFAULT 0 CHECK (speed BETWEEN 0 AND 10),
  tools       integer       NOT NULL DEFAULT 0 CHECK (tools BETWEEN 0 AND 10),
  scored_at   timestamptz   DEFAULT NOW(),
  scored_by   varchar(255)  NOT NULL
);
CREATE INDEX IF NOT EXISTS task_scores_team_id_idx ON task_scores(team_id);

CREATE TABLE IF NOT EXISTS social_media_scores (
  id                  serial        PRIMARY KEY,
  team_id             uuid          NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  week_number         integer       NOT NULL,
  content_quality     integer       NOT NULL DEFAULT 0 CHECK (content_quality BETWEEN 0 AND 10),
  posting_frequency   integer       NOT NULL DEFAULT 0 CHECK (posting_frequency BETWEEN 0 AND 10),
  likes               integer       NOT NULL DEFAULT 0 CHECK (likes BETWEEN 0 AND 10),
  views               integer       NOT NULL DEFAULT 0 CHECK (views BETWEEN 0 AND 10),
  followers           integer       NOT NULL DEFAULT 0 CHECK (followers BETWEEN 0 AND 10),
  comments            integer       NOT NULL DEFAULT 0 CHECK (comments BETWEEN 0 AND 10),
  scored_at           timestamptz   DEFAULT NOW(),
  scored_by           varchar(255)  NOT NULL
);
CREATE INDEX IF NOT EXISTS social_scores_team_id_idx ON social_media_scores(team_id);

CREATE TABLE IF NOT EXISTS presentation_scores (
  id          serial        PRIMARY KEY,
  team_id     uuid          NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  score       integer       NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10),
  scored_at   timestamptz   DEFAULT NOW(),
  scored_by   varchar(255)  NOT NULL
);
CREATE INDEX IF NOT EXISTS presentation_scores_team_id_idx ON presentation_scores(team_id);

CREATE TABLE IF NOT EXISTS games (
  id              serial        PRIMARY KEY,
  name            varchar(255)  NOT NULL,
  status          varchar(20)   NOT NULL DEFAULT 'live',
  answer          varchar(255)  NOT NULL,
  bonus_points    integer       NOT NULL DEFAULT 100,
  winner_team_id  uuid          REFERENCES teams(id),
  completed_at    timestamptz,
  created_at      timestamptz   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_attempts (
  id                    serial        PRIMARY KEY,
  game_id               integer       NOT NULL REFERENCES games(id),
  team_id               uuid          NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  current_level         integer       NOT NULL DEFAULT 1,
  final_answer_attempts integer       NOT NULL DEFAULT 0,
  is_locked_out         boolean       NOT NULL DEFAULT false,
  bonus_awarded         integer       NOT NULL DEFAULT 0,
  wordle_locked_until   timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz   DEFAULT NOW(),
  UNIQUE(game_id, team_id)
);
CREATE INDEX IF NOT EXISTS game_attempts_team_id_idx ON game_attempts(team_id);

-- Seed the first game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'Mysterious Game', 'GAME OF THRONES', 100
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Mysterious Game');

-- Seed the second game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'The Code Breaker', 'POMEGRANATE', 40
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'The Code Breaker');

-- Seed the third game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'Houston we have a problem!', 'BLACK HOLE', 150
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Houston we have a problem!');

-- Migrations (safe to re-run)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS group_number varchar(20);
