# Milestone 1: Application Shell

## Overview

This is an additive frontend implementation for the QMSync repository. It delivers the React + TypeScript + Vite application shell.

The milestone establishes the frontend foundation without implementing business workflows, authentication, authorization, or complete tenant isolation.

**Status: IMPLEMENTATION VERIFIED ON WINDOWS — 2026-11-26**

The frontend application shell has passed local dependency installation, TypeScript checks, frontend tests, Vite production build, Docker Compose integration, backend regression tests, health checks, and desktop/mobile browser inspection.

See the Windows Integration Verification Record below for the actual results.

The original packaging-environment verification is retained as historical evidence. Its limitations were subsequently addressed where applicable through Windows integration testing.

---

## What This Adds

| Path | Purpose |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite application: shell, dashboard, placeholder pages, API client, tests and styling |
| `docker-compose.frontend.yml` | Separate Compose override adding one service, `frontend`, on port 5173 |
| `docs/MILESTONE-1-APPLICATION-SHELL.md` | This milestone document |
| `docs/MS1-OVERLAY-MANIFEST.txt` | SHA-256 hashes and file sizes from the original overlay |

The implementation does not modify the existing backend Java sources, `pom.xml`, root `Dockerfile`, root `docker-compose.yml`, root `.gitignore`, `.env`, MySQL volume, or database migrations.

The Windows MySQL host mapping `3307:3306` is preserved. Inside the Docker Compose network, the backend continues to use `mysql:3306`.

Nothing in the frontend overlay reads or writes the root `.env` file.

---

## What the Application Shell Provides

### 1. Navigation

- Dashboard.
- Production Entry.
- Rejections.
- NCMR.
- CAPA.
- Training.
- Evidence.
- Audit Center.
- Reports.
- Organization.

Navigation is grouped into:

- Quality Workflow
- Insights
- Administration

### 2. Application Header

- Displays the current section.
- Provides mobile navigation controls.
- Displays a user area identifying the current session as Guest, not signed in.

Authentication has not been implemented.

### 3. Dashboard

The dashboard contains seven quality indicator cards:

- Production entries
- Rejection rate
- Open NCMRs
- Open CAPAs
- Training compliance
- Evidence records
- Audit readiness

All indicators intentionally display empty states because business workflows and their data sources are not implemented.

No fabricated sample business figures are displayed.

### 4. Backend Health Integration

The Backend Status card makes a real request to:

`/actuator/health`

The request is routed through the Vite development proxy.

It displays:

- Application status
- Database status
- Last checked time
- Loading and error states

### 5. Module Placeholder Pages

Modules B through J have placeholder pages describing planned capabilities.

These pages do not create or persist business records.

### 6. Centralized API Client

Location: `frontend/src/api/client.ts`

Capabilities include:

- Configurable API base URL through `VITE_API_BASE_URL`.
- Request timeout.
- Request cancellation.
- JSON response handling.
- Normalized `ApiError` types:
  - HTTP
  - NETWORK
  - TIMEOUT
  - ABORTED
  - PARSE
- Central error listeners through `onError`.

### 7. Responsive Layout and Accessibility

- Permanent sidebar at widths of 60rem and above.
- Off-canvas mobile drawer below 60rem.
- Escape key closes the mobile drawer.
- Clicking the background scrim closes the drawer.
- Selecting a navigation item closes the drawer.
- Skip link.
- Semantic landmarks.
- `aria-current` navigation state.
- Visible keyboard focus indicators.
- 44px touch targets.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 7 |
| Styling | CSS |
| Backend | Java 21 + Spring Boot 4.1.0 |
| Database | MySQL 8.4 |
| Containerization | Docker |
| Container orchestration | Docker Compose |
| Frontend tests | Node.js built-in test runner + tsx |
| Backend tests | JUnit + Spring Boot Test + Testcontainers |

---

## Repository Structure

```text
qmsync/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── navigation/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── state/
│   │   └── styles/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── docs/
│   ├── MILESTONE-1-APPLICATION-SHELL.md
│   └── MS1-OVERLAY-MANIFEST.txt
│
├── docker-compose.frontend.yml
│
├── src/
├── pom.xml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Local Development

Run the frontend from the repository root.

### Option A: Host Development Server

Requirements:

- Node.js 22.12 or later.
- npm.
- Backend running on `http://localhost:8080`.

Commands:

```powershell
cd frontend

npm install

npm run dev
```

Frontend URL:

`http://localhost:5173`

### Option B: Docker Compose

The frontend uses a separate Compose override.

This keeps the existing backend and MySQL service definitions unchanged.

Start the frontend:

```powershell
docker compose -f docker-compose.yml -f docker-compose.frontend.yml up -d --build --no-deps frontend
```

Check services:

```powershell
docker compose -f docker-compose.yml -f docker-compose.frontend.yml ps
```

Stop only the frontend:

```powershell
docker compose -f docker-compose.yml -f docker-compose.frontend.yml stop frontend
```

**Important:** Never run `docker compose down -v` during this milestone. It deletes the MySQL data volume.

### Port Configuration

| Service | Port |
|---|---:|
| Frontend | 5173 |
| Backend | 8080 |
| MySQL host mapping | 3307 |
| MySQL container port | 3306 |

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Empty (same origin) | Base URL for browser API requests |
| `QMSYNC_DEV_PROXY_TARGET` | `http://localhost:8080` | Vite development proxy target |
| `QMSYNC_FRONTEND_PORT` | `5173` | Frontend host port in Compose |
| `QMSYNC_BACKEND_URL` | `http://app:8080` | Backend URL used by the frontend container |

`VITE_API_BASE_URL` is browser-visible configuration and must never contain secrets.

The default Docker proxy target `http://app:8080` assumes the backend Compose service is named `app` and listens on port 8080.

---

## Windows Integration Verification Record

**Verification date:** November 26, 2026

**Environment:**

| Component | Version |
|---|---|
| Operating system | Windows |
| Node.js | 22.22.0 |
| npm | 10.9.4 |
| Java | 21.0.1 |
| Maven Wrapper distribution | 3.9.9 |
| Docker Desktop | 29.9.3 |
| Docker Compose | 5.7.1 |
| MySQL container | 8.4.10 |
| Spring Boot | 4.1.0 |
| Vite | 7.3.8 |

### 1. Frontend Verification

| Check | Result | Evidence |
|---|---|---|
| `npm install` | PASS | Dependencies installed; package-lock generated |
| `npm run typecheck` | PASS | Root, application and Node TypeScript projects |
| `npm test` | PASS | 59 tests, 17 suites, zero failures |
| `npm run build` | PASS | Actual Vite production build completed |
| Build output | PASS | Production assets generated in `frontend/dist/` |
| Dependency audit | PASS | npm reported zero vulnerabilities during installation |

### 2. Backend Regression Verification

The existing backend foundation was tested independently after the frontend integration.

The normal `.\mvnw.cmd -B -ntp test` invocation did not launch Maven correctly in the Windows environment.

The Maven Wrapper was therefore invoked directly through its wrapper JAR:

```powershell
$projectRoot = (Get-Location).Path

java "-Dmaven.multiModuleProjectDirectory=$projectRoot" `
  -cp ".mvn\wrapper\maven-wrapper.jar" `
  org.apache.maven.wrapper.MavenWrapperMain `
  -B -ntp test
```

Result:

| Metric | Result |
|---|---:|
| Tests run | 38 |
| Failures | 0 |
| Errors | 0 |
| Skipped | 0 |
| Build result | SUCCESS |

The test execution included the Testcontainers MySQL 8.4.10 integration and Flyway test fixture migration.

### 3. Docker Compose Integration

The existing MySQL and backend services were started first.

The frontend was then added using the separate Compose override.

Verified services:

- `mysql`
- `app`
- `frontend`

Results:

| Check | Result |
|---|---|
| Compose service configuration | PASS |
| MySQL container health | PASS |
| Backend container startup | PASS |
| Frontend container startup | PASS |
| Frontend port 5173 | PASS |
| Backend port 8080 | PASS |
| MySQL host mapping 3307:3306 | PRESERVED |
| Frontend container health | HEALTHY |

### 4. Health Endpoint Verification

Direct backend health endpoint:

`http://localhost:8080/actuator/health`

Result: `UP`

Frontend proxy health endpoint:

`http://localhost:5173/actuator/health`

Result: `UP`

The frontend successfully reached the backend through the Vite development proxy.

### 5. Desktop Browser Verification

The dashboard was opened in Chrome.

Verified:

- Application shell renders.
- Sidebar navigation is visible.
- Header renders correctly.
- Dashboard cards render.
- Empty states are displayed.
- Backend status card displays Application UP and Database UP.

Result: PASS.

### 6. Mobile Browser Verification

The dashboard was inspected using responsive device emulation.

Tested viewport widths:

- 400px
- 360px

Verified:

| Test | Result |
|---|---|
| Responsive dashboard layout | PASS |
| Vertical card stacking | PASS |
| No obvious horizontal overflow | PASS |
| Mobile hamburger button | PASS |
| Sidebar opens | PASS |
| Sidebar closes through outside click | PASS |
| Sidebar closes with Escape | PASS |
| Sidebar closes after navigation | PASS |
| Navigation labels remain readable | PASS |

### 7. Browser Console

The inspected browser Console screenshot showed no visible application errors.

Three hidden messages were indicated by DevTools but were not individually inspected.

Therefore, the recorded result is:

**No visible application errors in the inspected browser session.**

This is not a claim that every possible browser warning or hidden message has been eliminated.

---

## Historical Packaging-Environment Verification

The original overlay was prepared in an environment with limited network and infrastructure access.

Environment:

- Node.js 22.23.4.
- TypeScript 6.0.3.
- tsx 4.23.12.
- esbuild 0.28.2.
- Pre-installed React and ReactDOM 19.2.8.

The npm registry was unreachable due to DNS resolution failure. Docker and Maven were unavailable.

The original checks were:

| Check | Original result |
|---|---|
| Node test runner | 59 tests passed |
| Mutation checks | 7 of 7 deliberate breakages detected |
| Sandbox TypeScript checks | Partial; used hand-written React type shims |
| Vite configuration typecheck | Blocked; Vite dependencies unavailable |
| esbuild bundling | Passed; not a Vite production build |
| Compose override static validation | Passed |
| Collision, secret and encoding scan | Passed |
| npm install | Blocked by registry DNS failure |
| Docker image build | Blocked by unavailable Docker |
| Browser verification | Blocked by unavailable browser |
| Backend Maven tests | Not executed in that environment |

These results are retained for historical traceability.

The actual Windows integration results above supersede the original packaging-environment limitations wherever the same verification was subsequently performed.

---

## Design Decisions

1. **Additive frontend implementation**

   The frontend was introduced without replacing the existing backend foundation.

2. **Separate Docker Compose override**

   A separate Compose file adds the frontend service without modifying the existing backend or MySQL configuration.

3. **Vite development proxy**

   The frontend uses a development proxy for `/api` and `/actuator`, avoiding a backend CORS change for local development.

   The production deployment topology must be decided separately.

4. **Minimal History API router**

   A lightweight History API router is used instead of introducing a routing dependency.

   This is sufficient for the current static application shell. Authenticated routes and route parameters may require revisiting the router in a later milestone.

5. **Node built-in test runner**

   The frontend uses Node's built-in test runner with tsx instead of Vitest and Testing Library.

   Current tests cover logic and server-rendered markup. A DOM testing stack should be considered when interactive business forms are introduced.

6. **Dependency lockfile**

   `package-lock.json` is committed to make dependency installation reproducible. The frontend Dockerfile uses `npm ci` when the lockfile is available.

---

## Known Limitations

The following capabilities are intentionally outside MS1:

- Authentication.
- Authorization and role-based access control.
- Organization onboarding.
- Complete tenant isolation.
- Production business workflows.
- Production deployment configuration.
- Persistent business records.
- ERP and Tally integration.
- Evidence Graph implementation.
- Consistency Engine implementation.

The frontend Docker image currently runs the Vite development server. It is appropriate for local development and integration testing, not production deployment.

The module pages are placeholders and must not be interpreted as implemented business functionality.

---

## Milestone 1 Completion Criteria

MS1 establishes the frontend application foundation.

The following acceptance criteria have been verified:

- [x] React + TypeScript + Vite application initialized.
- [x] Responsive application shell implemented.
- [x] Sidebar navigation implemented.
- [x] Dashboard with intentional empty states implemented.
- [x] Backend health integration implemented.
- [x] Centralized API client implemented.
- [x] Frontend tests passed.
- [x] TypeScript checks passed.
- [x] Vite production build passed.
- [x] Backend regression tests passed.
- [x] Docker Compose integration verified.
- [x] Backend and database health verified.
- [x] Desktop browser inspection completed.
- [x] Mobile layout inspection completed.
- [x] Mobile sidebar interaction checks completed.
- [x] Feature branch committed and pushed.
- [x] Pull Request #1 created for review.

**Current Git milestone:**

- Repository: `theadarshh/qmsync`
- Branch: `feature/ms1-application-shell`
- Commit: `07075b8`
- Pull Request: #1
- Target branch: `main`

The implementation and local integration checks are complete. Final repository acceptance and merge remain subject to Pull Request review.

---

## Next Milestone

**Module B — Organization and Identity**

This milestone must have its own architecture and decision phase before implementation.

Topics to define include:

- Organization onboarding.
- Tenant lifecycle.
- User identity.
- Authentication.
- Sessions.
- Organization membership.
- Role-based access control.
- Tenant resolution.
- Tenant isolation.
- Auditability.

No Module B implementation should begin until the MS1 pull request has been reviewed and accepted.
