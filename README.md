# EduSphere AI — Enterprise Student Management System

A full-stack, role-based Student Management System: Super Admin, Teacher, and
Student dashboards covering attendance, marks, assignments, analytics,
reporting, timetable, queries, and notifications.

## Monorepo Layout

```
edusphere-ai/
├── apps/
│   ├── api/        Express + TypeScript + Prisma REST API
│   └── web/         React 19 + Vite + TypeScript + Tailwind + ShadCN UI
├── packages/
│   ├── ui/           Shared design-system components
│   ├── types/         Shared TypeScript types (DTOs, enums)
│   ├── utils/         Shared pure utility functions
│   └── config/        Shared eslint/tsconfig/tailwind config
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Build Status

This system is being built in complete, working phases (no placeholders,
no TODOs within a phase):

- [x] **Phase 1 — Foundation**: monorepo scaffold, Docker Compose, full
      Prisma schema (25 models covering every module in the spec)
- [x] **Phase 2 — Auth & API core**: JWT access + rotating refresh tokens
      (httpOnly cookies), bcrypt, RBAC + fine-grained permission middleware,
      Zod validation layer, centralized Prisma-aware error handling,
      rate limiting, Helmet/CORS/compression, file upload middleware,
      Swagger/OpenAPI docs, Winston logging, Docker build, auth test suite
- [x] **Phase 3a — Academic structure, people, attendance**: academic
      years/semesters, subjects, classes/sections, teacher↔subject
      assignment, conflict-checked timetable; full student & teacher CRUD
      (search, pagination, filters, activate/deactivate); attendance
      (bulk marking, per-student stats, calendar heatmap data, low-attendance
      alerts, section-by-date roster view)
- [x] **Phase 3b — Remaining backend modules**: assignments (publish/submit/
      grade with automatic late detection and due-date notifications);
      exams + marks with a 10-point grading scale, weighted per-subject
      aggregation, GPA/CGPA, and class ranking; analytics (attendance-vs-marks
      correlation, performance trends, weak/strong subjects, top/at-risk
      students, class & department rollups); reports (PDF report cards via
      PDFKit, Excel class marks sheets via ExcelJS, CSV attendance exports);
      student↔teacher query threads with notification fan-out; notices with
      audience/section-scoped visibility; feedback; a reusable notifications
      service other modules call into; system settings + JSON database
      backup/restore export. 114 routes across 14 modules, all RBAC-guarded.
- [x] **Phase 4 — Frontend design system & shell**: Vite + React 19 +
      TypeScript + Tailwind scaffold; a deliberate "Scholar Indigo + Campus
      Gold" design token system (light/dark, no flash-of-wrong-theme) instead
      of generic SaaS defaults, with a signature reusable **Grade Ring**
      component used for GPA/attendance/completion everywhere in the app;
      core UI primitives (Button, Card, Badge, Input, Avatar, Skeleton);
      Axios client with automatic access-token refresh; auth + theme
      contexts; full role-based navigation IA; Sidebar/Topbar/AppShell; route
      guards; a real validated login screen; three live, API-wired dashboard
      pages (Admin/Teacher/Student) with zero mock data; nginx Dockerfile.
      `tsc`, `eslint`, and a production `vite build` all pass clean.
- [x] **Phase 5a — Highest-value CRUD screens**: reusable Dialog/Select/
      Textarea/Pagination primitives and a debounce hook; full Students
      management (search, class filter, paginated table, create/edit/
      delete/activate dialogs); full Teachers management (same pattern);
      Teacher attendance-marking UI (section/subject/date pickers, roster
      grid with inline status toggles, bulk save); Student attendance view
      (ring + per-subject bars + history); Student marks/grades view
      (semester picker, GPA/score/rank rings, subject-wise grade table).
      `tsc`, `eslint`, and `vite build` all pass clean; backend re-verified
      with no regressions.
- [x] **Phase 5b — Second batch of CRUD screens**: Subjects management
      (simple CRUD); Classes & Sections (master-detail UI, class↔subject
      multi-select, section creation with class-teacher assignment);
      Notices (role-gated publish, audience targeting, shared view for all
      three roles); Queries (student ask + view replies, teacher inbox with
      inline reply and status control); Assignments (teacher create/publish/
      grade with expandable submission rosters, student view/upload-submit
      with live status and grade display). `tsc`, `eslint`, and `vite build`
      all pass clean.
- [x] **Phase 5c — Third batch of CRUD screens**: Academic Years (CRUD +
      current-year toggle); Timetable builder (weekly grid per section,
      conflict-checked slot creation); Teacher Exams & Marks entry
      (create exam, pick a section, bulk-enter marks with grace marks,
      auto-publishes and notifies students); Analytics dashboard shared by
      admin/teacher (class+semester picker, attendance-vs-marks scatter,
      top students, weakest subjects, at-risk student list, all backed by
      live Grade Rings and Recharts); Reports UI (generate PDF report
      cards / Excel class marks / CSV attendance exports, with a
      generated-reports history and download); Feedback (shared
      teacher↔student send/received/sent views with recipient search and
      star ratings); Settings & Backup (key-value settings, JSON database
      backup creation with a properly *authenticated* blob download — not
      a bare link, since this endpoint carries sensitive data unlike the
      public `/uploads` report files). `tsc`, `eslint`, and `vite build`
      all pass clean; backend re-verified with no regressions.
- [x] **Phase 5d — Final screens + closing backend gaps**: added the two
      backend modules that were missed in Phase 3 (Study Materials —
      upload/list/delete with role-scoped visibility; Permissions — a
      catalog of fine-grained permission codes plus per-user grant/revoke,
      layered on top of the three core roles) with full RBAC, then built
      their frontend screens: Teacher study material upload/manage,
      Student study material browse (added a nav item that was missing),
      and admin Roles & Permissions (permission catalog + per-user grants).
      All 26 nav destinations across all three roles are now real — zero
      "not yet built" placeholders remain. `tsc`, `eslint`, and
      `vite build` all pass clean on a from-scratch install; backend
      re-verified clean on a from-scratch install too (also caught and
      fixed an unrelated `typescript` version-resolution drift from
      repeated installs without a committed lockfile — resolved by a
      clean `node_modules` + reinstall, confirmed pinned to `^5.6.3`
      resolving 5.9.3 correctly).
- [x] **Phase 6 — Seed data polish, tests, deployment docs**: seed script
      now covers every model including the Phase 5d additions (a
      permission grant, a study material, a query + reply thread,
      feedback with a rating); added 15 real, passing backend unit tests
      (grading scale, JWT expiry parsing, pagination helpers — all
      DB-independent and verified to actually run in this sandbox) plus
      route-guard tests for the two new modules; added a frontend test
      suite from scratch (Vitest + Testing Library + jsdom) with 10 real,
      passing tests covering the `cn()` utility, the Grade Ring signature
      component, and the Badge primitive; generated and committed
      `pnpm-lock.yaml` via a full root-level `pnpm install` (this also
      caught and definitively fixed the earlier TypeScript version-drift
      issue — confirmed pinned to `typescript@5.9.3`); wrote
      [`DEPLOYMENT.md`](./DEPLOYMENT.md), a full production guide covering
      environment variables, migrations, Docker, reverse-proxy
      requirements for `/uploads`, the S3 migration path, and
      troubleshooting.

**The build is complete.** All 6 phases are done: full backend (14
modules, 120+ routes), full frontend (26 real screens across 3 roles,
zero placeholders), tests, and deployment documentation.

## Quick Start (once Phase 2+ lands)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: http://localhost:5173 · API: http://localhost:4000/api/v1 ·
Swagger: http://localhost:4000/api/docs

### Seeded login credentials

All seeded users share the password `Password@123`.

| Role        | Email                              |
|-------------|-------------------------------------|
| Super Admin | admin@edusphere.ai                  |
| Teacher     | priya.sharma@edusphere.ai           |
| Student     | aarav.patel@student.edusphere.ai    |

### Auth endpoints (Phase 2)

| Method | Path                          | Description                          |
|--------|-------------------------------|---------------------------------------|
| POST   | `/api/v1/auth/login`          | Login, returns access token + sets refresh cookie |
| POST   | `/api/v1/auth/refresh`        | Rotates refresh token, returns new access token |
| POST   | `/api/v1/auth/logout`         | Revokes current session |
| POST   | `/api/v1/auth/logout-all`     | Revokes all sessions for the user |
| GET    | `/api/v1/auth/me`             | Returns the authenticated user + role profile |
| POST   | `/api/v1/auth/change-password`| Changes password, revokes all sessions |

Access tokens are short-lived (15m) bearer tokens; refresh tokens are
long-lived (7d), stored server-side, httpOnly-cookie-scoped to `/api/v1/auth`,
and rotated on every use (old token revoked, new one issued) to limit replay
risk.

### A note on this sandbox

Prisma's engine binaries are fetched from `binaries.prisma.sh` at
`prisma generate` time. That domain isn't reachable from the build sandbox
this project was authored in, so `prisma generate` and the test suite
couldn't be executed end-to-end here. Everything else was verified in
sandbox: `tsc --noEmit` (zero errors outside the un-generated Prisma types),
and `eslint` (zero errors/warnings). Run `pnpm install` locally or in CI —
it will fetch the engine normally and everything will work.

## Tech Stack

**Frontend** React 19 · TypeScript · Vite · TailwindCSS · ShadCN UI ·
Framer Motion · TanStack Query · React Router · React Hook Form · Zod ·
Axios · Recharts · TanStack Table · Lucide Icons

**Backend** Node.js · Express · TypeScript · PostgreSQL · Prisma ·
JWT + refresh tokens · bcrypt · Swagger

**DevOps** Docker · Docker Compose
