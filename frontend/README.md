# QMSync frontend (Milestone 1: application shell)

React 19 + TypeScript + Vite. This milestone delivers the application shell only: sidebar navigation,
header and user area, a dashboard with honest empty states, placeholder pages for every planned module,
a centralized API client and a live backend health check. No business workflow, authentication or tenant
isolation exists yet.

## Requirements

- Node.js 22.12 or newer and npm
- The QMSync backend on http://localhost:8080 (for the live status card; the shell renders without it)

## Run locally

    cd frontend
    npm install
    npm run dev          # http://localhost:5173

The Vite dev server proxies `/api` and `/actuator` to the backend (default `http://localhost:8080`), so the
browser only ever talks to one origin and the backend needs no CORS configuration.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 |
| `npm run typecheck` | `tsc` for the app, the tests and `vite.config.ts` |
| `npm test` | Node's built-in test runner through `tsx` (logic and server-rendered component tests) |
| `npm run build` | Typecheck, then the Vite production build into `dist/` |
| `npm run preview` | Serve `dist/` on port 5173 |

## Configuration

Copy `.env.example` to `.env.local` to override defaults. Only `VITE_`-prefixed variables reach browser code:
never put secrets in them.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty (same origin) | Base URL of API calls |
| `QMSYNC_DEV_PROXY_TARGET` | `http://localhost:8080` | Dev-server proxy target (not exposed to the browser) |

## Structure

    src/api          centralized API client (errors, timeout, listeners) and the Actuator health call
    src/state        pure view-state logic (health)
    src/router       small History-API router behind a narrow interface
    src/navigation   registry of planned modules that drives the sidebar and placeholder pages
    src/components   layout (shell, sidebar, header, user area) and UI primitives
    src/pages        dashboard, module placeholder, not found
    src/styles       design tokens, base, layout and component styles

See `docs/MILESTONE-1-APPLICATION-SHELL.md` in the repository root for Docker Compose usage, design decisions
and known limitations.
