# TeamHQ

TeamHQ is a Next.js/TypeScript team operations dashboard for managing projects, deliverables, team members, activity history and performance reporting. It uses Prisma and a PostgreSQL database with role-based application access.

> **Project status:** Under active development. This repository has not yet been given a project-level open-source license. Public visibility alone does not grant permission to reuse or redistribute its source code.

## Features currently represented in the source

- Task and project management, including board views and deadline tracking
- Team member views, dashboards and reports
- Role-based permissions and signed user sessions
- API routes with Prisma data persistence
- Workspace seed data for local demonstrations

## Requirements

- Node.js 22 or later and npm
- PostgreSQL for the repository's default `prisma/schema.prisma`
- A secure authentication secret (`AUTH_SECRET`) and an appropriately configured database

## Local development

1. Run `npm ci`.
2. Create a `.env` file (do **not** commit it) with a PostgreSQL `DATABASE_URL`, `NODE_ENV=development`, `AUTH_SECRET` and, if you need demo seeding, `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`. Refer to [`.env.example`](.env.example) for names. Replace production example values with development settings.
3. Run `npx prisma generate`.
4. **Only for a disposable local database**, run `npm run db:sync`. Review Prisma's proposed schema changes before applying them.
5. Run `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

Note: Alternative SQLite schemas are present under `prisma/` but the default configured Prisma schema uses PostgreSQL. Switching providers requires intentional configuration; merely changing `DATABASE_URL` to SQLite will not work with the default schema.

## Database safety

- `npm run build` generates Prisma Client and builds Next.js; it no longer implicitly changes the database schema.
- `npm run db:sync` is a **manual** development operation. Review it carefully; do not treat it as a safe production migration strategy.
- **HTTP database seeding is disabled**. Only the operator-controlled CLI may run demo seeding.
- `npm run seed` is **destructive**: it deletes and recreates tasks, projects and team members in the default workspace. The CLI is blocked in production and requires `ADMIN_PASSWORD` (12+ characters) and `CONFIRM_DEMO_SEED=YES_DELETE_WORKSPACE_DATA`. Use a throwaway database only.
- Production deployments should use reviewed, versioned database migrations and a separate deployment procedure rather than automatic schema pushes or demo seeding.

## Authentication and configuration

- Set `AUTH_SECRET` to a unique, securely generated secret of **at least 32 characters** in production. Production startup/authentication now fails closed instead of using a published fallback.
- Configure strong initial administrator credentials explicitly. The application does not auto-create an administrator with a known default password.
- Changing `AUTH_SECRET` invalidates existing signed sessions. If this repository was deployed using the earlier fallback secret, rotate the secret and any potentially affected credentials immediately.
- Do not expose a development server to the public Internet or deploy any seed data without checking confidentiality and ownership.

## Verification

Configuration checks (no database required):

```bash
npm run test:config
```

The existing `npm test` integration suite expects a seeded database and must be run only against a disposable database, not production data.

## Licensing and contributor status

A project-wide license and a review of embedded demo content and Git history are still needed before promoting TeamHQ as open source. See [SECURITY.md](SECURITY.md) for reporting concerns privately.
