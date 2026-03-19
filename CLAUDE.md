# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no test command in this project.

## Architecture

**Mayumi Frontend** — an OSU! tournament management platform built with Next.js App Router.

### Tech Stack
- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **HeroUI v2** — primary component library
- **Framer Motion** — animations
- **ECharts** — data visualization in tournament stats
- **SWR** — data fetching/caching
- **react-dnd** — drag-and-drop (mappool management)
- **Sentry** — error tracking

### App Router Structure

```
app/
├── (home)/                      # Authenticated pages (tournament management)
│   ├── tournament-management/[tournament]/{meta,team,scheduler,statistics,mappool,member,round}/
│   └── create-tournament/
├── tournaments/[tournament]/    # Public-facing tournament pages
│   └── {home,mappools,participants,rules,schedule,staff,stats}/
├── admin/                       # Admin panel
├── oauth/                       # OAuth callback handler
├── actions.tsx                  # Server actions (getMe, etc.)
├── providers.tsx                # App-wide context providers
└── user_context.tsx             # User context (OSU! user data)
```

### Backend Integration

- Backend base URL: `NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:8421`)
- Authentication: cookie-based (`uuid` cookie)
- Key env vars: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_CLIENT_ID`, `CLIENT_SECRET`

### Key Patterns

- **Server Actions** in `app/actions.tsx` fetch data from the backend (e.g., `getMe()`)
- **User context** (`user_context.tsx`) wraps the app with OSU! user data (UID, username, country, per-mode statistics)
- **Gamemode icons** are served via a custom `FontAwesomeExtra` font defined in `styles/globals.css`
- **Custom tier colors** (iron → lustrous) are defined in `tailwind.config.js` and used throughout ranking displays
- Path alias `@/*` maps to the repository root

### Deployment

GitHub Actions pushes to an Ubuntu server via SSH, installs deps, builds, and restarts a PM2 process. Requires secrets: `HOST`, `USERNAME`, `KEY`, `ENV_FILE`, `SENTRY_AUTH_TOKEN`.
