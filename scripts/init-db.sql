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

-- Seed the fifth game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'The Final Piece', 'ADOLF HITLER', 100
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'The Final Piece');

-- Seed the fourth game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'The Hunt', 'KRATOS', 50
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'The Hunt');

-- Seed the third game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'Houston we have a problem!', 'BLACK HOLE', 150
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Houston we have a problem!');

CREATE TABLE IF NOT EXISTS game_chat_messages (
  id          serial        PRIMARY KEY,
  game_id     integer       NOT NULL REFERENCES games(id),
  team_id     uuid          NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role        varchar(20)   NOT NULL,
  content     text          NOT NULL,
  created_at  timestamptz   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS game_chat_messages_lookup_idx
  ON game_chat_messages(game_id, team_id);

-- Seed the sixth game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'THE FINAL BOSS??!!', 'RETRO', 200
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'THE FINAL BOSS??!!');

-- Seed the seventh game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'Dungeon - 12 Doors of Death', 'AVADAKEDAVRAMRASYLBI', 200
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Dungeon - 12 Doors of Death');

-- Seed the eighth game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'PRESS THE BUTTON', 'GETOFFMYLOWN50', 200
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'PRESS THE BUTTON');

-- Seed the combination game (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'COMBINATION GAME', 'FLAMINGOBIRD100', 50
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'COMBINATION GAME');

-- Seed the final game — Deadman's Choice (safe to re-run)
INSERT INTO games (name, answer, bonus_points)
SELECT 'THE FINAL GAME (DEADMAN''S CHOICE)', 'TONYSTARKISIRONMAN', 50
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'THE FINAL GAME (DEADMAN''S CHOICE)');

-- Seed Campus Survivor — high-score-by-deadline game (safe to re-run).
-- No fixed answer string; the winner is the team with the highest score
-- when the deadline (May 10, 2026 18:00 GMT+5 = May 10 13:00 UTC) passes.
-- The 'answer' column is required NOT NULL by the schema, so we store a
-- sentinel that no submission can match.
INSERT INTO games (name, answer, bonus_points)
SELECT 'CAMPUS SURVIVOR', '__HIGHSCORE_DEADLINE__', 100
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'CAMPUS SURVIVOR');

-- Per-run scoreboard for Campus Survivor. One row per submitted run.
-- The team's best run determines their leaderboard position.
CREATE TABLE IF NOT EXISTS campus_survivor_scores (
  id              serial        PRIMARY KEY,
  team_id         uuid          NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  score           integer       NOT NULL DEFAULT 0,
  kills           integer       NOT NULL DEFAULT 0,
  time_survived   integer       NOT NULL DEFAULT 0,
  level_reached   integer       NOT NULL DEFAULT 1,
  gold_earned     integer       NOT NULL DEFAULT 0 CHECK (gold_earned >= 0),
  client_run_id   varchar(80),
  source          varchar(20)   NOT NULL DEFAULT 'game',
  admin_note      text,
  admin_user_id   varchar(255),
  submitted_at    timestamptz   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS campus_survivor_scores_team_idx ON campus_survivor_scores(team_id);
CREATE INDEX IF NOT EXISTS campus_survivor_scores_score_idx ON campus_survivor_scores(score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS campus_survivor_scores_team_client_run_idx
  ON campus_survivor_scores(team_id, client_run_id);

-- Per-team shop state for Campus Survivor (gold + upgrade levels).
-- Upserted on every purchase and end-of-run so coins survive across
-- devices and code updates.
CREATE TABLE IF NOT EXISTS campus_survivor_shop (
  team_id     uuid        PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  gold        integer     NOT NULL DEFAULT 0 CHECK (gold >= 0),
  stats       jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz DEFAULT NOW()
);

-- Migrations (safe to re-run)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS group_number varchar(20);
ALTER TABLE game_attempts ADD COLUMN IF NOT EXISTS level_cooldown_until timestamptz;
ALTER TABLE game_attempts ADD COLUMN IF NOT EXISTS level_sub_round integer NOT NULL DEFAULT 0;
ALTER TABLE campus_survivor_scores ADD COLUMN IF NOT EXISTS gold_earned integer NOT NULL DEFAULT 0 CHECK (gold_earned >= 0);
ALTER TABLE campus_survivor_scores ADD COLUMN IF NOT EXISTS client_run_id varchar(80);
ALTER TABLE campus_survivor_scores ADD COLUMN IF NOT EXISTS source varchar(20) NOT NULL DEFAULT 'game';
ALTER TABLE campus_survivor_scores ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE campus_survivor_scores ADD COLUMN IF NOT EXISTS admin_user_id varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS campus_survivor_scores_team_client_run_idx
  ON campus_survivor_scores(team_id, client_run_id);
