# Milestone 1: Application shell

This is an additive overlay for the QMSync repository root. It adds files and changes none. It delivers the
React + TypeScript + Vite application shell only: no business workflow, no authentication and no tenant isolation.

Status: source delivered and partly verified. Steps marked BLOCKED in "Delivery verification record" were not
executed in the packaging environment (no npm registry, Docker or Maven access) and must be run on your machine.

## What this adds (51 files)

| Path | Purpose |
| --- | --- |
| `frontend/` | React 19 + TypeScript + Vite app: shell, dashboard, placeholder pages, API client, tests |
| `docker-compose.frontend.yml` | Separate Compose override that adds ONE service, `frontend`, on port 5173 |
| `docs/MILESTONE-1-APPLICATION-SHELL.md` | This document |
| `docs/MS1-OVERLAY-MANIFEST.txt` | SHA-256 and size of every other file in the overlay |

It does not touch the backend sources, `pom.xml`, the root `Dockerfile`, `docker-compose.yml`, `.gitignore`, `.env`,
the MySQL volume or any migration. Your Windows MySQL host mapping `3307:3306` is not redefined anywhere, and inside
the Compose network the backend keeps using `mysql:3306`. Nothing in the overlay reads or writes `.env`.

## What the shell does

- Sidebar navigation: Dashboard plus the nine planned modules (Production Entry, Rejections, NCMR, CAPA, Training,
  Evidence, Audit Center, Reports, Organization), grouped as Quality workflow, Insights and Administration.
- Header with the current section and a user area that says plainly "Guest, not signed in" (no authentication yet).
- Dashboard with honest empty states: seven indicator cards that say "No data yet" and a callout stating that nothing
  has been recorded. No sample or hard-coded business figures exist anywhere.
- One real backend call: the Backend status card reads `/actuator/health` through the dev proxy and shows
  loading, UP/DOWN (application and database) or the reason the backend is unreachable.
- Placeholder pages for modules B to J that state "not implemented yet" and list the planned capabilities.
- Centralized API client (`src/api/client.ts`): base URL from `VITE_API_BASE_URL`, timeout, cancellation, JSON
  handling, normalized `ApiError` (HTTP, NETWORK, TIMEOUT, ABORTED, PARSE) and `onError` listeners for central handling.
- Responsive layout: permanent sidebar from 60rem, off-canvas drawer below it (Escape and the scrim close it);
  skip link, landmarks, `aria-current`, visible focus ring and 44px touch targets.

## Integrate it (Windows PowerShell, from the repository root: the folder holding pom.xml and docker-compose.yml)

    git checkout -b feature/ms1-application-shell        # skip if the folder is not a Git repository
    (Get-FileHash .\qmsync-ms1-frontend-overlay.zip -Algorithm SHA256).Hash   # compare with the .sha256 file

    # List conflicts BEFORE extracting (prints nothing when there are none)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path .\qmsync-ms1-frontend-overlay.zip).Path)
    $zip.Entries | Where-Object { $_.Name -ne "" -and (Test-Path $_.FullName) } | ForEach-Object { "CONFLICT: $($_.FullName)" }
    $zip.Dispose()

    # Extract (without -Force it refuses to overwrite an existing file)
    Expand-Archive -Path .\qmsync-ms1-frontend-overlay.zip -DestinationPath .

To remove the overlay: delete `frontend/`, `docker-compose.frontend.yml` and the two files under `docs/`.

## Run it

Ports: frontend 5173, backend 8080, MySQL host port 3307 (unchanged, still yours).

A. Dev server on the host (backend running on http://localhost:8080):

    cd frontend
    npm install            # generates package-lock.json: commit it
    npm run dev            # http://localhost:5173

B. Docker Compose (adds only the frontend; running containers are not recreated):

    docker compose -f docker-compose.yml -f docker-compose.frontend.yml up -d --build --no-deps frontend
    docker compose -f docker-compose.yml -f docker-compose.frontend.yml stop frontend      # stop only the frontend

Never run `docker compose down -v`: it deletes the MySQL data volume.

| Variable | Default | Where | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | empty (same origin) | `frontend/.env.local` | Base URL of API calls (browser-visible: no secrets) |
| `QMSYNC_DEV_PROXY_TARGET` | `http://localhost:8080` | `frontend/.env.local` | Dev-server proxy target for `/api` and `/actuator` |
| `QMSYNC_FRONTEND_PORT` | `5173` | shell or Compose `.env` | Host port of the frontend container |
| `QMSYNC_BACKEND_URL` | `http://app:8080` | shell or Compose `.env` | Backend URL used by the frontend container |

`http://app:8080` assumes your backend service is named `app` and listens on 8080 inside Docker (true for the CP3
baseline). Check with `docker compose config --services`; if yours differs, set `QMSYNC_BACKEND_URL`.

## Verification you must run (record the results)

    cd frontend
    npm install
    npm run typecheck      # tsc: app, tests and vite.config.ts
    npm test               # Node test runner through tsx
    npm run build          # typecheck, then the Vite production build into dist/
    cd ..
    docker compose -f docker-compose.yml -f docker-compose.frontend.yml up -d --build --no-deps frontend
    docker compose -f docker-compose.yml -f docker-compose.frontend.yml ps

Then open http://localhost:5173 (dashboard, sidebar, drawer below 960px width, Backend status card),
`Invoke-RestMethod http://localhost:5173/actuator/health` (through the proxy) and
`Invoke-RestMethod http://localhost:8080/actuator/health` (directly). Re-run the backend suite
(`.\mvnw.cmd -B -ntp test`) to confirm your existing baseline is unaffected: the overlay changes no backend file.

## Delivery verification record (packaging environment)

Environment: Node 22.23.4, TypeScript 6.0.3, tsx 4.23.12, esbuild 0.28.2, React and ReactDOM 19.2.8 from a pre-installed
tool directory. The npm registry was unreachable (DNS failure for registry.npmjs.org), so `npm install` could not run and
Vite, `@vitejs/plugin-react`, `@types/react` and `@types/react-dom` were not available.

| Check | Result |
| --- | --- |
| `npm run test` | EXECUTED, PASS: 59 tests in 17 suites, 59 passed, 0 failed (real React 19.2.8 server rendering) |
| Mutation checks | EXECUTED: 7 of 7 deliberate breakages (health 503 handling, module codes, aria-current, empty-state wording, HTML error echo, database status default, JSON content type) were caught by the suite |
| `tsc -p tsconfig.json` and `tsc -p tsconfig.app.json` | EXECUTED, exit 0, but against hand-written sandbox type shims for React, not the real `@types/react`: not a substitute for `npm run typecheck` |
| `tsc -p tsconfig.node.json` (`vite.config.ts`) | EXECUTED, FAILED for an environmental reason: `vite` and `@vitejs/plugin-react` are not installed |
| esbuild bundle of `src/main.tsx` | EXECUTED, exit 0 (minified `main.js` 215,309 bytes, `main.css` 8,994 bytes). This is a bundling sanity check, NOT the Vite production build |
| Compose healthcheck command | EXECUTED: exit 0 with a listener on 127.0.0.1:5173, exit 1 without one |
| Compose override structure | EXECUTED: parses as YAML, defines only `frontend`, no overlap with the CP3 baseline services, no volumes or networks, no MySQL or `DB_` settings |
| Collision, secret and encoding scan | EXECUTED: 0 path collisions with the CP3 baseline, no forbidden paths, no secrets, ASCII only, LF line endings |
| `npm install`, `npm run typecheck`, `npm run build` (Vite) | BLOCKED: npm registry unreachable. `package-lock.json` could not be generated |
| Docker image build and `docker compose up` | BLOCKED: Docker is not available |
| Browser access to the dashboard | BLOCKED: no browser or Docker. The responsive CSS and the drawer interaction have not been seen in a browser |
| Backend `mvnw test` (38 tests) and `/actuator/health` | NOT EXECUTED: Maven and the stack are not available. No backend file is changed by this overlay |

CP3 (`qmsync-M1-3-test-corrections.tar.gz`) is historical baseline evidence used only for the collision check and the
service names; it is not your current Windows repository, which was not inspected.

## Design decisions

1. Additive overlay: new files only, so your working Windows configuration cannot be overwritten.
2. Separate Compose override instead of editing `docker-compose.yml`: preserves your `3307:3306` mapping and `.env`.
3. Dev-server proxy instead of CORS: the browser sees one origin, so the backend needed no change. Revisit when the
   production deployment topology (reverse proxy or separate origins) is decided.
4. Minimal History-API router behind `Router`, `Link`, `NavLink` and `useRoute`: the shell has static routes, and
   `react-router-dom` could not be installed or verified in the packaging environment. Replace it when authenticated
   routes and route parameters arrive (Module B onward); only `src/router` and its imports change.
5. Node's built-in test runner with `tsx` instead of Vitest plus Testing Library: the tests were runnable and verified
   in the packaging environment with no extra dependencies. They cover logic and server-rendered markup. Add a DOM
   test stack when interactive forms arrive.
6. Dependencies use caret ranges (react 19.2, vite 7, `@vitejs/plugin-react` 5, typescript 6): exact pins could not be
   verified without the registry. Commit the `package-lock.json` that the first `npm install` generates; the Dockerfile
   then uses `npm ci` automatically.

## Known limitations

- Not tested: the mobile drawer interaction, `useBackendHealth` effect timing and `vite.config.ts` behaviour.
- The Docker image runs the Vite dev server: appropriate for local development, not a production deployment.
- Module placeholders create and show no records. Authentication, roles, tenant isolation and every business module
  remain for later milestones (next: Module B, organization and identity).
