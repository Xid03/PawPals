# PawPals

PawPals is a playful mobile-first cat social app built with Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, and Prisma. The project includes a mobile-style frontend plus backend API routes for auth, cat profiles, discover/matching, posts, stories, chat, vets, bookings, events, health tips, notifications, and uploads.

## Features

- Onboarding, auth, home, discover, cat profile, community feed, stories, vets, vet detail, chat, create post, and user profile routes
- Reusable UI components for navigation, cards, chips, buttons, headers, posts, vets, and stories
- Soft PawPals theme with pastel peach, pink, cream, and lavender colors
- Mobile app style shell centered on desktop
- Prisma schema, migrations, seed data, validation, auth middleware, and tests
- Mock-ready REST API designed for later Capacitor iOS/Android wrapping

## Getting Started

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` to point at PostgreSQL.

Generate Prisma Client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Seed development data:

```bash
npm run db:seed
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Backend

API routes live under `src/app/api`. Shared backend code lives under `src/server`.

Key backend pieces:

- Auth: email/password register, login, logout, JWT cookie/Bearer auth
- Security: bcrypt password hashing, Zod validation, protected routes, ownership checks, rate limits for auth/swipes/messages, upload type/size validation
- Data: PostgreSQL schema in `prisma/schema.prisma`
- Seed: `prisma/seed.ts`
- Tests: `src/server/__tests__`

Full API documentation:

[docs/API.md](docs/API.md)

Postman collection:

[docs/pawpals.postman_collection.json](docs/pawpals.postman_collection.json)

## Capacitor Readiness

The UI and API are separated by REST endpoints, which keeps the frontend ready for a Capacitor wrapper. For mobile builds, point the app at a deployed API URL through environment configuration and keep file uploads routed through `/api/uploads`.
