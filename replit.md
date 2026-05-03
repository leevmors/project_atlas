# Project Atlas | Lingua HQ Leaderboard

A Next.js 16 leaderboard app for student translation companies competing in Lingua HQ. Features an alpine winter theme with a live leaderboard, team registration, login, and admin panel. Backed by PostgreSQL with server-side session authentication.

## Architecture

- **Framework**: Next.js 16 (App Router) with webpack bundler
- **Styling**: Tailwind CSS 4 + tw-animate-css, custom alpine winter theme
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Package Manager**: npm
- **Database**: Replit PostgreSQL (accessed via `DATABASE_URL` env var)
- **Auth**: Server-side sessions with httpOnly cookies (`atlas_sid`), bcrypt-hashed passwords for both teams and admin

## Key Directories

- `app/` — Next.js App Router pages (layout, home, login, register, admin, team)
- `app/api/` — API route handlers (auth, teams CRUD, scores)
- `components/` — UI components including leaderboard, app shell, auth provider
- `lib/` — Shared utilities (db.ts, store.ts, types.ts)
- `hooks/` — Custom React hooks
- `public/` — Static assets (icons, images)

## API Routes

- `POST /api/auth/login` — Login as team or admin; sets httpOnly cookie
- `GET /api/auth/session` — Returns current session from cookie
- `POST /api/auth/logout` — Clears session cookie and DB record
- `GET /api/teams` — All teams with aggregated scores (sorted by grandTotal)
- `POST /api/teams` — Register new team (hashes password with bcrypt)
- `DELETE /api/teams/[id]` — Admin-only delete team
- `POST /api/scores/task` — Admin-only add task score
- `PUT /api/scores/task/[id]` — Admin-only edit task score
- `DELETE /api/scores/task/[id]` — Admin-only delete task score
- `POST /api/scores/social` — Admin-only add social media score
- `PUT /api/scores/social/[id]` — Admin-only edit social media score
- `DELETE /api/scores/social/[id]` — Admin-only delete social score
- `POST /api/scores/presentation` — Admin-only upsert presentation score
- `PUT /api/scores/presentation/[id]` — Admin-only edit presentation score
- `DELETE /api/scores/presentation/[id]` — Admin-only delete presentation score

## Database Tables

- `admins` — id (serial), username (unique), password_hash, created_at
- `teams` — id (serial), company_name, password_hash, instagram, threads, email, members (jsonb), created_at
- `task_scores` — id (serial), team_id (FK), task_name, accuracy, quality, speed, tools, scored_at, scored_by
- `social_media_scores` — id (serial), team_id (FK), week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by
- `presentation_scores` — id (serial), team_id (FK unique), score, scored_at, scored_by
- `sessions` — id (uuid), user_type, user_id, user_name, expires_at

## Admin Credentials

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables (Replit Secrets). The first login will hash and store the admin in the database. Do not hardcode credentials in source files.

## Replit Configuration

- Dev server runs on port 5000 (`next dev --webpack -p 5000 -H 0.0.0.0`)
- Uses `--webpack` flag to avoid a Turbopack incompatibility with Tailwind 4's `mask-[url(...)]` utility class generation
- `next.config.mjs` disables css-loader URL/import resolution so PostCSS handles all CSS imports

## Running

The app starts automatically via the "Start application" workflow using `npm run dev`.

## Final Game (Deadman's Choice) — Phase 3 Mini-Games

The Final Game lives in `public/games/final-game/` and is loaded by
`app/games/final-game/page.tsx`. Phase 3 (the in-cabin tablet) randomly
picks **3 of 41 mini-games** for each run (40 new + the polished
original Reflex Tap; the polished originals of Math Sprint and Simon
Says are listed within the new Pattern and Memory categories).

### Architecture

- `index.html` owns the shared chrome:
  - `#mg-stage` (800×570) — every game renders inside this single element
  - `#mg-hud-time`, `#mg-hud-score`, `#mg-banner`, `#mg-intro` — shared HUD
  - Pixel-art CSS utilities (`.px-bg/fg/btn/tile/flash/shake`) and
    `image-rendering: pixelated` for crunchy pixel look
- `index.html` runtime helpers:
  - `buildGameCtx(onEnd)` — gives each game a `ctx` with `setTimer`,
    `setScore`, `interval`, `timeout`, `clearInterval/Timeout`, `raf`,
    `loop(dt)`, `on(target,type,fn)`, `el(tag,attrs,...children)`,
    `banner(text,kind,ms)`, `win()`, `lose()`. The ctx tracks every
    interval/timeout/RAF/listener and tears them down on `_abort()`.
  - `initPhase3` shuffles `Object.keys(window.MINIGAMES)` and picks 3.
  - `launchGame(id, game, isAdminTest)` runs a game; `completeGame()`
    advances the run (or bounces back to the menu in admin test mode).
  - Unknown game ids fail safely as a lost round (never auto-win).
- `minigames.js` defines `window.MINIGAMES`, a registry of 41 games:
  - **Reflex (10)**: flappy_bird, piano_tiles, whack_color, fruit_ninja,
    mole_rush, falling_blocks, bug_smash, balloon_pop, tap_number, red_green
  - **Aim/Power (10)**: basketball, archery, angry_birds, paper_toss,
    cannon, darts, penalty_kick, bowling, pool, bottle_flip
  - **Memory (10)**: simon_says, memory_match, sequence_recall,
    cup_shuffle, pattern_flash, odd_one_out, story_recall, sound_sequence,
    color_memory, word_recall
  - **Pattern (10)**: color_rules, math_sprint, spot_imposter,
    sequence_completion, symbol_decoder, sorting, flow_connect, grid_logic,
    analogy_sprint, password_crack
  - **Polished original (1)**: reflex_tap — the classic 10-hit mole
    tapper, hardened with non-overlapping spawns. Math Sprint (with -3s
    wrong-answer time penalty) and Simon Says (target sequence length 8)
    are the polished versions of the other two originals and live in
    the Pattern and Memory categories above.

### Adding a new mini-game

In `public/games/final-game/minigames.js` add an entry to `M`:

```js
M.my_game = {
  title: 'MY GAME',
  desc: 'One-line description shown on the intro card.',
  run(ctx) {
    // build UI inside ctx.stage using ctx.el / ctx.on / etc.
    // call ctx.win() or ctx.lose() exactly once.
  }
};
```

Helpers available in the file's outer scope: `mkCanvas`, `countdown`,
`pxBtn`, `sfx.{hit,ok,bad,tick,win,lose}`, `rand/randInt/pick/shuffle/clamp`.
Pure DOM/Canvas — no new dependencies. The game is automatically eligible
for random selection in Phase 3 and shows up in the admin "TEST MINIGAME"
dropdown after a refresh.
