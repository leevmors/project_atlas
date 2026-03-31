# Project Atlas | Lingua HQ Leaderboard

A Next.js 16 leaderboard app for student translation companies competing in Lingua HQ. Features an alpine winter theme with a live leaderboard, team registration, login, and admin panel. Backed by PostgreSQL with server-side session authentication.

## Architecture

- **Framework**: Next.js 16 (App Router) with webpack bundler
- **Styling**: Tailwind CSS 4 + tw-animate-css, custom alpine winter theme
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Package Manager**: npm
- **Database**: Replit PostgreSQL (accessed via `DATABASE_URL` env var)
- **Auth**: Server-side sessions with httpOnly cookies (`atlas_sid`), bcrypt-hashed team passwords

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
- `DELETE /api/scores/task/[id]` — Admin-only delete task score
- `POST /api/scores/social` — Admin-only add social media score
- `DELETE /api/scores/social/[id]` — Admin-only delete social score
- `POST /api/scores/presentation` — Admin-only upsert presentation score
- `DELETE /api/scores/presentation/[id]` — Admin-only delete presentation score

## Database Tables

- `teams` — id (serial), company_name, password_hash, instagram, threads, email, members (jsonb), created_at
- `task_scores` — id (serial), team_id (FK), task_name, accuracy, quality, speed, tools, scored_at, scored_by
- `social_media_scores` — id (serial), team_id (FK), week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by
- `presentation_scores` — id (serial), team_id (FK unique), score, scored_at, scored_by
- `sessions` — id (uuid), user_type, user_id, user_name, expires_at

## Admin Credentials

- Default: `leev` / `8702594qwe` (set `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars to override)
- Credentials are server-side only — never bundled to client

## Replit Configuration

- Dev server runs on port 5000 (`next dev --webpack -p 5000 -H 0.0.0.0`)
- Uses `--webpack` flag to avoid a Turbopack incompatibility with Tailwind 4's `mask-[url(...)]` utility class generation
- `next.config.mjs` disables css-loader URL/import resolution so PostCSS handles all CSS imports

## Running

The app starts automatically via the "Start application" workflow using `npm run dev`.
