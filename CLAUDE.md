# CLAUDE.md

This file provides guidance to coding agents when working with this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npx tsc --noEmit # TypeScript check
```

There is no test command in this project.

## Architecture

Mayumi Frontend is an osu! tournament management platform built with Next.js App Router.

### Tech Stack

- Next.js App Router + TypeScript + Tailwind CSS 4
- HeroUI v3 as the primary component library
- ECharts for tournament stats visualizations
- SWR for data fetching/caching
- react-dnd for drag-and-drop mappool management
- Sentry for error tracking

### App Router Structure

```text
app/
├── (home)/                      # Authenticated pages and tournament management
│   ├── tournament-management/[tournament]/{meta,team,scheduler,statistics,mappool,member,round}/
│   └── create-tournament/
├── tournaments/[tournament]/    # Public-facing tournament pages
│   └── {home,mappools,participants,rules,schedule,staff,stats}/
├── admin/                       # Admin panel
├── oauth/                       # OAuth callback handler
├── actions.tsx                  # Server actions such as getMe()
├── providers.tsx                # App-wide providers
└── user_context.tsx             # osu! user context
```

### Backend Integration

- Backend base URL: `NEXT_PUBLIC_BACKEND_URL`, defaulting to `http://localhost:8421`
- Authentication is cookie-based with a `uuid` cookie.
- Key env vars: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_CLIENT_ID`, `CLIENT_SECRET`

### Key Patterns

- Server actions in `app/actions.tsx` fetch data from the backend.
- `user_context.tsx` wraps the app with osu! user data.
- Gamemode icons are served via a custom `FontAwesomeExtra` font in `styles/globals.css`.
- Custom tier colors are defined in `tailwind.config.js` and used throughout ranking displays.
- Path alias `@/*` maps to the repository root.

### HeroUI v3 Migration Notes

- Use native HeroUI v3 components from `@heroui/react`; the legacy compatibility layer `components/ui.tsx` has been removed.
- HeroUI v3 uses compound components, for example `Card.Header` / `Card.Content`, `Tabs.ListContainer` / `Tabs.List` / `Tabs.Tab` / `Tabs.Panel`, and `Avatar.Image` / `Avatar.Fallback`.
- Do not use removed v2-style components or props in new migrations, including `User`, `Image`, `Snippet`, `CardBody`, `CardHeader`, `isExternal`, `avatarProps`, and `classNames` slot props.
- Replace v2 `User` with an explicit layout: anchor/link + `Avatar` + text.
- `styles/globals.css` maps `--color-primary` to HeroUI v3 `--accent`; `text-primary` is valid. In dark mode, add explicit `dark:group-hover:text-primary` when a `dark:text-*` class is also present.
- For `Card variant="transparent"`, HeroUI may still provide root padding. Use `!p-0` on the card root when exact custom padding is required, then set padding on `Card.Content`.

### Participants Page UI Notes

- `components/participants_comp.tsx` has been migrated to native HeroUI v3 imports.
- Team cards should darken on hover, but team names should not change color because team cards are not clickable.
- Player names inside team rows should be normal by default and turn blue only when the player row is hovered.
- Captain rows use a rounded amber highlight. Captain avatars should not have a gold border.
- The solo registration grid should not show staff/role badges.
- Keep solo registration card padding moderate: card root `!p-0`, content around `!px-3 !py-3`.
- Use Chinese copy for member counts, for example `{count} 名成员`, not `Members`.

### Deployment

GitHub Actions pushes to an Ubuntu server via SSH, installs dependencies, builds, and restarts a PM2 process. Required secrets: `HOST`, `USERNAME`, `KEY`, `ENV_FILE`, `SENTRY_AUTH_TOKEN`.
