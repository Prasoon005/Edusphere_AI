<div align="center">

# 🎓 EduSphere AI

**A full-stack, role-based Student Management System**

Attendance · Marks & Exams · Assignments · Analytics · Reports · Timetable · Queries · Notifications

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](apps)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](apps/web)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=node.js&logoColor=white)](apps/api)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](apps/api)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](docker-compose.yml)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](apps/api/prisma)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)](pnpm-workspace.yaml)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

[Quick Start](#-quick-start) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Project Structure](#-project-structure) · [API Docs](#-api-reference) · [Deployment](./DEPLOYMENT.md)

</div>

---

## 📖 Overview

EduSphere AI is an enterprise-grade Student Management System built as a
TypeScript monorepo, with three fully-wired role-based experiences —
**Super Admin**, **Teacher**, and **Student** — backed by a single
RBAC-guarded REST API. There is no mock data and no placeholder screens:
every one of the 26 navigation destinations across all three roles is a
real, API-connected feature.

## ✨ Features

| Module | Highlights |
|---|---|
| **Auth & Security** | JWT access + rotating refresh tokens (httpOnly cookies), bcrypt hashing, RBAC + fine-grained permission grants, rate limiting, Helmet/CORS/compression |
| **Academic Structure** | Academic years/semesters, subjects, classes & sections, teacher↔subject assignment, conflict-checked timetable builder |
| **People** | Full student & teacher lifecycle — search, filters, pagination, activate/deactivate, per-user permission overrides |
| **Attendance** | Bulk marking, section-by-date roster view, per-student stats, calendar heatmap data, low-attendance alerts |
| **Assignments** | Publish → submit → grade workflow with automatic late detection and due-date notifications |
| **Exams & Marks** | 10-point grading scale, weighted per-subject aggregation, GPA/CGPA computation, class ranking |
| **Analytics** | Attendance-vs-marks correlation, performance trends, weak/strong subjects, top & at-risk students, class/department rollups |
| **Reports** | PDF report cards (PDFKit), Excel class marksheets (ExcelJS), CSV attendance exports, with an authenticated download history |
| **Communication** | Student↔teacher query threads, audience/section-scoped notices, feedback with ratings, a shared notification service |
| **Study Materials** | Role-scoped upload, browse, and delete |
| **Settings & Backup** | Key-value system settings, authenticated JSON database backup/restore |

Each dashboard is built around a signature **Grade Ring** component —
a single reusable visual language for GPA, attendance, and completion
metrics — on a custom **Scholar Indigo + Campus Gold** design system with
full light/dark theming (no flash-of-wrong-theme).

## 🏗️ Architecture

```
                     ┌─────────────────────┐
                     │   React 19 + Vite    │   apps/web
                     │  Tailwind · ShadCN   │
                     └──────────┬───────────┘
                                │  Axios (auto token refresh)
                     ┌──────────▼───────────┐
                     │  Express + TypeScript │   apps/api
                     │  RBAC · Zod · Winston │
                     └──────────┬───────────┘
                                │  Prisma ORM
                     ┌──────────▼───────────┐
                     │      PostgreSQL       │   docker-compose.yml
                     └───────────────────────┘
```

## 📦 Project Structure

```
edusphere-ai/
├── apps/
│   ├── api/            Express + TypeScript + Prisma REST API
│   │   ├── src/modules/  20 feature modules, 138+ RBAC-guarded routes
│   │   └── prisma/        32-model schema, migrations, seed script
│   └── web/             React 19 + Vite + TypeScript + Tailwind + ShadCN UI
│       └── src/pages/     26 role-based screens (Admin / Teacher / Student)
├── packages/
│   ├── ui/               Shared design-system components
│   ├── types/             Shared TypeScript types (DTOs, enums)
│   ├── utils/              Shared pure utility functions
│   └── config/              Shared eslint/tsconfig/tailwind config
├── docker-compose.yml
├── DEPLOYMENT.md        Production deployment guide
└── pnpm-workspace.yaml
```

## 🚀 Quick Start

**Prerequisites:** Node.js ≥ 20, pnpm ≥ 9, Docker

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env

# 3. Start the database
docker compose up -d postgres

# 4. Run migrations and seed data
pnpm db:migrate
pnpm db:seed

# 5. Start the app
pnpm dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:4000/api/v1 |
| Swagger docs | http://localhost:4000/api/docs |

### Seeded login credentials

All seeded users share the password `Password@123`.

| Role | Email |
|---|---|
| Super Admin | `admin@edusphere.ai` |
| Teacher | `priya.sharma@edusphere.ai` |
| Student | `aarav.patel@student.edusphere.ai` |

### Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run web + API together in watch mode |
| `pnpm build` | Production build of both apps |
| `pnpm lint` / `pnpm typecheck` | Lint / type-check every workspace |
| `pnpm test` | Run all test suites |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Reset the database (migrate + seed) |
| `pnpm docker:up` / `docker:down` | Start/stop the full Docker Compose stack |

## 🔐 API Reference

Interactive Swagger/OpenAPI docs are served at `/api/docs` once the API is
running. Authentication is token-based:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login — returns access token, sets refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Rotates refresh token, returns new access token |
| `POST` | `/api/v1/auth/logout` | Revokes the current session |
| `POST` | `/api/v1/auth/logout-all` | Revokes all sessions for the user |
| `GET` | `/api/v1/auth/me` | Returns the authenticated user + role profile |
| `POST` | `/api/v1/auth/change-password` | Changes password, revokes all sessions |

Access tokens are short-lived (15m) bearer tokens; refresh tokens are
long-lived (7d), stored server-side, httpOnly-cookie-scoped to
`/api/v1/auth`, and rotated on every use — the old token is revoked and a
new one issued — to limit replay risk.

## 🧰 Tech Stack

<table>
<tr><td><strong>Frontend</strong></td><td>

React 19 · TypeScript · Vite · TailwindCSS · ShadCN UI · Framer Motion ·
TanStack Query · TanStack Table · React Router · React Hook Form · Zod ·
Axios · Recharts · Lucide Icons

</td></tr>
<tr><td><strong>Backend</strong></td><td>

Node.js · Express · TypeScript · PostgreSQL · Prisma · JWT + refresh
tokens · bcrypt · Zod · Winston · Swagger/OpenAPI · PDFKit · ExcelJS

</td></tr>
<tr><td><strong>Tooling / DevOps</strong></td><td>

pnpm workspaces · Docker · Docker Compose · ESLint · Vitest + Testing
Library

</td></tr>
</table>

## 🧪 Testing

```bash
pnpm test
```

Backend: DB-independent unit tests covering the grading scale, JWT expiry
parsing, pagination helpers, and route-guard checks for every module.
Frontend: Vitest + Testing Library + jsdom covering shared utilities and
core design-system components (e.g. the Grade Ring).

## 📦 Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full production guide —
environment variables, migrations, Docker builds, reverse-proxy
configuration for `/uploads`, an S3 migration path, and troubleshooting.

## 🗺️ Build Status

All planned phases are complete: a 32-model schema, a 20-module / 138+
route RBAC-guarded API, 26 real screens across three roles with zero
placeholders, backend + frontend test suites, and production deployment
docs.

<details>
<summary>Phase-by-phase history</summary>

- **Phase 1 — Foundation**: monorepo scaffold, Docker Compose, full Prisma schema
- **Phase 2 — Auth & API core**: JWT auth, RBAC middleware, Zod validation, centralized error handling, rate limiting, security middleware, Swagger docs, logging
- **Phase 3a — Academic structure, people, attendance**: academic years/semesters, subjects, classes/sections, timetable, student/teacher CRUD, attendance
- **Phase 3b — Remaining backend modules**: assignments, exams & marks (GPA/CGPA), analytics, reports (PDF/Excel/CSV), queries, notices, feedback, notifications, settings & backup
- **Phase 4 — Frontend design system & shell**: Tailwind design tokens, Grade Ring component, core UI primitives, auth/theme contexts, role-based navigation, live dashboards
- **Phase 5a–5d — CRUD screens**: Students, Teachers, Attendance, Marks, Subjects, Classes & Sections, Notices, Queries, Assignments, Academic Years, Timetable, Exams, Analytics, Reports, Feedback, Settings, Study Materials, Roles & Permissions
- **Phase 6 — Polish**: full seed data, backend + frontend test suites, committed lockfile, production deployment guide

</details>

---

<div align="center">

Built with TypeScript, end to end.

</div>
