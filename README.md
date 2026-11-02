# TeamHQ

**A project and task operations dashboard built with Next.js, TypeScript, and Prisma.**

TeamHQ brings project status, assigned work, team activity, and delivery metrics into one interface. It is a portfolio project exploring how structured tracking and useful visualizations can make day-to-day project coordination clearer.

## What it includes

- **Project overview:** project listings, status, priorities, and delivery milestones.
- **Task management:** create, update, filter, and organize work, including a board view.
- **Team directory:** member records and task ownership.
- **Dashboards and reporting:** task status, completion progress, delivery timelines, and activity insights.
- **Search and navigation:** locate relevant tasks and projects across the workspace.
- **Authenticated pages:** a sign-in flow and protected dashboard/API routes.

These capabilities are based on the repository's current application pages and API routes. The application is a work in progress; descriptions here are not guarantees of production readiness.

## Technology

| Layer | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS, Lucide icons, Recharts, dnd-kit |
| Data | Prisma with PostgreSQL schema |
| Validation | Zod |
| Authentication | Server-side session handling |

## Repository structure

```text
src/app/dashboard/       # Project, task, team, report, and activity screens
src/app/api/             # Server-side API routes
src/components/          # Reusable interface components
src/lib/services/        # Business logic and data access services
src/lib/                 # Authentication, validation, and shared utilities
prisma/                  # Database schemas and migrations
scripts/                 # Local checks and setup utilities
```

## Local development

Requirements: a supported Node.js installation, npm, and a **dedicated development database**.

```bash
git clone https://github.com/shizwan/TeamHQ.git
cd TeamHQ
npm install
```

1. Create a local environment file using the example configuration in `.env.example`; supply your **own** database URL and a strong, unique `AUTH_SECRET`.
2. Configure and initialize a disposable development database using the Prisma schema appropriate to that database.
3. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

**Important:** The current `npm run build` script invokes `prisma db push --accept-data-loss`, which can modify the configured database schema. Do not run it against live or valuable data without reviewing and changing that behavior. Never use example credentials in a deployed environment.

## Quality checks

The repository provides the following scripts for development and validation:

```bash
npm run lint
npm test
```

Run checks in a configured test/development environment. A passing local check does not by itself establish that the application is ready for public deployment.

## Engineering focus

This project explores practical questions in application development:

- How to present project progress without hiding exceptions or blocked work.
- How to keep task state, ownership, and activity history understandable.
- How to organize authentication, validation, service logic, and UI components into maintainable boundaries.
- How to build dashboards that support better decisions rather than simply displaying more metrics.

## Project status

TeamHQ is an evolving software project and technical portfolio example. Please review the security model, configuration defaults, database schema changes, and existing code before deploying or integrating it with real data.

For the current implementation, start with `src/app/dashboard/`, `src/lib/services/`, and `prisma/`.
