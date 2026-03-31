# Project Atlas | Lingua HQ Leaderboard

A Next.js 16 leaderboard app for student translation companies competing in Lingua HQ. Features an alpine winter theme with a live leaderboard, team registration, login, and admin panel.

## Architecture

- **Framework**: Next.js 16 (App Router) with webpack bundler
- **Styling**: Tailwind CSS 4 + tw-animate-css, custom alpine winter theme
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Package Manager**: npm

## Key Directories

- `app/` — Next.js App Router pages (layout, home, login, register, admin, team)
- `components/` — UI components including leaderboard, app shell, auth provider
- `lib/` — Shared utilities
- `hooks/` — Custom React hooks
- `public/` — Static assets (icons, images)

## Replit Configuration

- Dev server runs on port 5000 (`next dev --webpack -p 5000 -H 0.0.0.0`)
- Uses `--webpack` flag to avoid a Turbopack incompatibility with Tailwind 4's `mask-[url(...)]` utility class generation
- `next.config.mjs` disables css-loader URL/import resolution so PostCSS handles all CSS imports

## Running

The app starts automatically via the "Start application" workflow using `npm run dev`.
