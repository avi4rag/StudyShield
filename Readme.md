# StudyShield

StudyShield is a student-retention and early-warning platform for educators. It combines learner activity, quiz completion, and login recency into explainable risk signals so educators can identify students who need support and take action early.

The application is a Next.js App Router project with a Prisma-backed PostgreSQL data layer, Auth.js Google authentication, protected educator workflows, and a responsive dashboard for student monitoring and outreach.

## What StudyShield Does

Educators can:

- Sign in with Google or use the existing email/password flow.
- Review cohort-wide student counts and risk distribution.
- Search and filter students by name, batch, and risk category.
- Inspect student activity, quiz attempts, scores, inactivity, and risk signals.
- Add students to batches.
- Send and review educator nudges and outreach messages.
- View reports, early-warning signals, recent activity, and engagement trends.

The application also contains student-facing route scaffolding and role-aware authentication models for future student workflows.

## Authentication

StudyShield uses Auth.js v5 beta with the Google OAuth provider.

### Google sign-in flow

1. A user selects **Continue with Google** on `/login`.
2. Auth.js performs the OAuth flow and creates a signed application session.
3. The Auth.js sign-in callback upserts an application user by the verified Google email. Existing application roles are preserved; new Google users are created as educators.
4. Protected routes accept the verified Auth.js session.
5. The user is redirected to `/dashboard`.

The existing email/password login remains supported. Its legacy JWT session is also recognized by the server authentication helper, allowing both authentication paths to use the same protected APIs.

### Required authentication variables

Copy `.env.example` to `.env.local` and configure:

```dotenv
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
```

Generate `AUTH_SECRET` with a password manager or a cryptographically secure generator. Never commit `.env.local`, OAuth secrets, database credentials, or real tokens.

### Google Cloud Console

For local development, configure a Google OAuth **Web application** client with:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

The redirect URI must match exactly. Production must use the deployed HTTPS origin and its matching Auth.js callback URL.

## Data and Authorization

The application uses PostgreSQL through Prisma. The main domain models include:

- `users` for application identity, role, and account status.
- `educators` for educator profiles.
- `students` and `batches` for the learner cohort.
- `quizzes` and `quiz_attempts` for learning progress.
- `student_activities` for activity history.
- `nudges` for educator outreach.

Server routes determine the authenticated user from a verified Auth.js session or the existing legacy session. Client-supplied user IDs are not accepted as proof of identity.

The student API remains protected:

| Request state | Response |
|---|---|
| No valid session | `401 Unauthorized` |
| Valid session without educator/admin access | `403 Forbidden` |
| Active educator or admin | `200 OK` with permitted data |

The primary student endpoint is `GET /api/students`. It reads real database records and calculates the response fields used by the dashboard. Authentication failures are not converted into empty arrays.

## Risk Model

Each student receives a risk score from 0 to 100. Higher scores indicate greater risk:

```text
R(t) = min(100, 0.6 * (100 - Q) + 0.4 * L)
L = min(100, inactive_days * 25)
Q = quiz completion rate from 0 to 100
```

Risk categories in the API are:

| Category | Score |
|---|---:|
| Healthy | 0-39 |
| Medium | 40-69 |
| High | 70-100 |

The dashboard also reports quiz completion, average score, missed deadlines, last active time, recommended action, and generated warning signals.

## Technology

| Area | Technology |
|---|---|
| Framework | Next.js 16.3 with App Router |
| Language | TypeScript and JavaScript data/services |
| UI | React 19 |
| Styling | Tailwind CSS 4 and project CSS variables |
| Authentication | Auth.js / `next-auth` 5.0.0-beta.32 |
| OAuth provider | Google |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Database adapter | Neon serverless adapter |
| Icons | Lucide React |
| Password hashing | bcryptjs |
| Legacy session signing | jose |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL or a Neon PostgreSQL database
- Google OAuth credentials for Google sign-in

### Install

```bash
npm install
```

### Configure environment variables

```bash
copy .env.example .env.local
```

Set the following values in `.env.local`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/studyshield"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/studyshield"
JWT_SECRET="a-long-random-secret-for-the-legacy-session-flow"
AUTH_SECRET="a-long-random-secret-for-authjs"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_ALLOWED_EMAILS=""
AUTH_ALLOWED_EMAIL_DOMAINS="unacademy.com"
```

`DATABASE_URL` is used by the runtime database adapter. `DIRECT_URL` is used by Prisma configuration and migrations. Keep both values private.

`AUTH_ALLOWED_EMAILS` accepts a comma-separated list of approved addresses. `AUTH_ALLOWED_EMAIL_DOMAINS` accepts a comma-separated list of approved company domains. At least one allowlist must be configured. Exact addresses take priority for organizations that do not want to allow every user in a domain.

Public signup is disabled. The `/signup` page redirects to `/login`, and direct requests to `POST /api/auth/signup` return `403 Forbidden`. Password login and Google OAuth both enforce the same allowlist.

### Prepare the database

Apply migrations with:

```bash
npx prisma migrate deploy
```

Seed the development database when seed data is needed:

```bash
npx prisma db seed
```

The seed script is idempotent for its development records and creates batches, quizzes, educators, students, attempts, and activity data.

The seed also creates five development-only educator accounts. Passwords are hashed before storage and the accounts are safe to recreate with the seed command:

| Email | Password |
|---|---|
| `test.educator01@unacademy.com` | `StudyShield!Test01` |
| `test.educator02@unacademy.com` | `StudyShield!Test02` |
| `test.educator03@unacademy.com` | `StudyShield!Test03` |
| `test.educator04@unacademy.com` | `StudyShield!Test04` |
| `test.educator05@unacademy.com` | `StudyShield!Test05` |

These credentials are for local or test environments only. Change or remove them before using a shared or production database.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful routes:

- `/login` - email/password and Google sign-in.
- `/dashboard` - protected educator dashboard.
- `/students` - protected student management view.
- `/messages` - protected outreach view.
- `/reports` - protected reports view.
- `/risk-signals` - protected risk signal view.
- `/student/dashboard` - protected Auth.js session verification page.

### Production commands

```bash
npm run build
npm start
```

The production build validates route handlers, TypeScript, server/client boundaries, and static generation.

## API Overview

Authentication routes:

- `GET|POST /api/auth/[...nextauth]` - Auth.js handlers.
- `POST /api/auth/login` - legacy email/password login.
- `POST /api/auth/signup` - legacy account creation.
- `POST /api/auth/logout` - clears the legacy session.
- `GET /api/auth/me` - returns the legacy authenticated application user.

Protected application routes include:

- `GET|POST /api/students`
- `GET /api/students/[id]`
- `GET /api/dashboard/activity`
- `GET /api/dashboard/signals`
- `GET /api/nudges`
- `POST /api/nudges`
- `GET /api/batches`

The `proxy.ts` guard protects dashboard and application route segments before page rendering. API handlers still perform their own server-side authentication and authorization checks.

## Caching and Error States

The client-side `lib/cache.ts` helper deduplicates short-lived GET requests and caches responses in memory for the current browser tab. It is not a server-wide shared cache. The cache is cleared when the authenticated identity changes or the user signs out, preventing authenticated responses from being reused across users in the same tab.

Dashboard data has distinct states:

- Loading: displays loading skeletons.
- Successful empty response: displays `No students found`.
- Successful data response: displays student metrics and risk views.
- Authentication or server failure: displays an error state with retry instead of showing fake zero data.

Percentages are guarded for empty datasets, so the UI renders `0%` rather than `NaN%`.

## Project Structure

```text
app/
  api/
    auth/[...nextauth]/       Auth.js route handlers
    auth/login, signup/...    Legacy auth endpoints
    students/                 Protected student API
    dashboard/                Dashboard data APIs
    nudges/                   Outreach API
  components/
    auth/                     Auth context, forms, Google sign-in, sign-out
    dashboard/                Dashboard widgets and state views
    layout/                   Navigation and welcome header
    messages/                 Outreach views
    modals/                   Student, report, and nudge modals
  dashboard/                  Protected educator dashboard
  login/                      Sign-in page
  reports/                    Reports page
  risk-signals/               Risk signals page
  students/                   Student list and detail pages
  student/dashboard/          Protected student session test page
  layout.tsx                  Root providers and metadata
  globals.css                 Global and feature styles

auth.ts                       Auth.js provider, callbacks, and server helpers
proxy.ts                      Protected route proxy
lib/auth/                     Session, password, and application-user helpers
lib/cache.ts                  Client request cache and deduplicator
lib/prisma.ts                 Prisma client and Neon adapter setup
prisma/schema.prisma          PostgreSQL schema
prisma/migrations/            Database migrations
prisma/seed.js                Development seed data
data/                         Local dashboard/message fixtures
services/                     Messaging business logic
PRD.txt                       Product requirements and roadmap
```

## Troubleshooting

### Google sign-in reports a configuration error

Check that `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` exist in `.env.local`, then restart the development server. Confirm that the Google Cloud redirect URI is exactly:

```text
http://localhost:3000/api/auth/callback/google
```

### `/api/students` returns 401

The request has no valid Auth.js or legacy session. Sign in again and confirm the development server is running on the same origin as the browser.

### `/api/students` returns 403

The session is valid, but the database user is not an active `EDUCATOR` or `ADMIN`. Check the corresponding `users.role` and `users.is_active` values in the database.

### The dashboard shows no students

Check the browser network response first. A successful `200` with an empty array means there are no student records available to display. A `401`, `403`, or `5xx` response should appear as an error state and should be investigated rather than treated as an empty cohort.

### Hydration warning mentions browser-extension attributes

Some browser extensions inject attributes onto the root `<body>` before React hydrates. The root layout suppresses warnings for that known external mutation. Application-generated hydration mismatches should still be investigated separately.

## Verification

Run the production build before opening a pull request:

```bash
npm run build
```

For authentication and data changes, also verify:

1. An unauthenticated `GET /api/students` returns `401`.
2. A signed-in educator can load `/dashboard` and receives student data from the API.
3. A valid but unauthorized role receives `403`.
4. An empty successful response displays `No students found`.
5. Sign-out clears the session and protected routes redirect to `/login`.

## Contributing

1. Start from the latest `main`.
2. Create a focused branch such as `feat/feature-name` or `fix/problem-name`.
3. Keep secrets and `.env.local` out of commits.
4. Use conventional commit messages, for example:

   ```bash
   git commit -m "fix: resolve authenticated student data fetching"
   ```

5. Run `npm run build` and any relevant checks.
6. Push the branch and open a pull request against `main`.

## License

StudyShield is part of the [Kalvium Community](https://github.com/kalviumcommunity) and is intended for educational purposes.
