# PawPals

<p align="center">
  <img src="public/icon.png" alt="PawPals logo" width="96" height="96" />
</p>

<h3 align="center">A full-stack social platform for cat lovers, PawPal discovery, events, stories, memes, chats, and vet support.</h3>

<p align="center">
  <a href="https://github.com/Xid03/PawPals"><img alt="GitHub repo" src="https://img.shields.io/badge/GitHub-PawPals-181717?style=for-the-badge&logo=github" /></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel" />
</p>

---

## Overview

**PawPals** is a mobile-first web app designed to make the pet community more connected, interactive, and helpful. Users can create profiles, upload PawPal cat profiles, share posts, upload stories and memes, chat privately, discover nearby PawPals, join events, save content, and find vet clinics in Malaysia.

The project is built as a full-stack Next.js application with a Prisma/PostgreSQL backend, Cloudinary media uploads, JWT authentication, protected API routes, and a polished pastel cat-themed interface.

## Preview

| Discover PawPals | PawPal Details | Events | Memes |
| --- | --- | --- | --- |
| ![Discover PawPals](sample%20image/pawpal1.png) | ![PawPal details](sample%20image/pawpal3.png) | ![Events page](sample%20image/event1.png) | ![Memes page](sample%20image/memes1.png) |

| Event Details | Community Post |
| --- | --- |
| ![Event details](sample%20image/event3.png) | ![Community post](sample%20image/samplePost1.png) |

## Features

### Social & Profiles

- User registration and login with JWT authentication
- Public and private user profiles
- Follow, unfollow, follow request, accept request, and follow-back flows
- Followers and following lists with privacy-aware access control
- Notifications for follow requests, new followers, likes, messages, and other activity

### PawPal Discovery

- Upload PawPal profiles with images, name, age, gender, breed, location, personality, and bio
- Discover PawPals uploaded by other users
- Search across cat name, breed, personality, bio, and location
- Filter PawPals by all, nearby, and Malaysian state
- Match-style swipe actions and PawPal match handling
- Direct chat entry from PawPal detail pages

### Community, Stories & Memes

- Create posts with media and topics
- Stories with image/video upload, viewer count, story replies, and 24-hour expiry
- Story avatar grouping by user
- Viewed/unviewed story border behavior
- Meme upload flow with preview, likes, comments, saves, and owner-only deletion
- Saved memes and saved posts support

### Chat

- Private conversations between users
- Open or create a direct chat from user and PawPal profiles
- Text messages, image messages, emoji sending, and story reply previews
- Full-size image preview modal
- Edit and delete own messages with confirmation UI
- Delete chat conversations from the chat list

### Events, Vet Clinics & Health

- Event creation with image upload, category, date, location, and city
- Event detail pages and saved events
- Search and category filters for events
- Vet clinic directory with Malaysian clinic data
- Vet detail pages with directions, website links, and favorite support
- Health tips with daily tips, categories, search, and save functionality

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| UI & Icons | Lucide React, custom PawPals image assets |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Cloud Database | Neon |
| Media Storage | Cloudinary |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| Testing | Vitest |
| Deployment | Vercel |

## Architecture

```mermaid
flowchart TD
  User[User / Browser] --> UI[Next.js React UI]
  UI --> API[Next.js API Routes]
  API --> Auth[JWT Auth + Route Guards]
  API --> Prisma[Prisma ORM]
  Prisma --> DB[(Neon PostgreSQL)]
  API --> Uploads[Upload API]
  Uploads --> Cloudinary[(Cloudinary Media Storage)]
  API --> Notifications[Notifications / Chat / Feed Logic]
```

## Core Workflow

```mermaid
sequenceDiagram
  participant U as User
  participant UI as PawPals UI
  participant API as API Route
  participant DB as Neon PostgreSQL
  participant CDN as Cloudinary

  U->>UI: Create post / story / PawPal
  UI->>API: Submit form data
  API->>CDN: Upload media
  CDN-->>API: Return secure media URL
  API->>DB: Save record with Prisma
  DB-->>API: Return saved data
  API-->>UI: Send updated response
  UI-->>U: Refresh UI instantly
```

## Getting Started

### Prerequisites

Install the following:

- Node.js 20+
- npm
- PostgreSQL database, or a Neon database
- Cloudinary account for production media uploads

### Installation

Clone the repository:

```bash
git clone https://github.com/Xid03/PawPals.git
cd PawPals
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Update `.env` with your own values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run migrations locally:

```bash
npm run prisma:migrate
```

Seed development data:

```bash
npm run db:seed
```

For production-safe seed data only:

```bash
npm run db:seed:vets
npm run db:seed:health-tips
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server |
| `npm run test` | Run Vitest tests |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run local Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed full development data |
| `npm run db:seed:vets` | Seed Malaysia vet clinic data safely |
| `npm run db:seed:health-tips` | Seed health tips safely |
| `npm run vercel-build` | Production build command for Vercel |

## Deployment

PawPals is designed to deploy on **Vercel** with **Neon PostgreSQL** and **Cloudinary**.

### 1. Create a Neon Database

1. Create a free Neon project.
2. Copy the pooled connection string for `DATABASE_URL`.
3. Copy the direct connection string for `DIRECT_URL`.
4. Add both values to Vercel environment variables.

### 2. Configure Cloudinary

Create a Cloudinary account and add these values to Vercel:

```env
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Configure Vercel Environment Variables

Add:

```env
DATABASE_URL="..."
DIRECT_URL="..."
JWT_SECRET="..."
APP_URL="https://your-domain.com"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 4. Build Command

Use:

```bash
npm run vercel-build
```

This runs:

```bash
prisma generate
prisma migrate deploy
npm run db:seed:vets
npm run db:seed:health-tips
next build
```

> Do not use `prisma migrate dev` on Vercel. Production deployment should use `prisma migrate deploy`.

## API Documentation

Backend API routes are located in `src/app/api`.

Additional API documentation is available here:

- [API Documentation](docs/API.md)
- [Postman Collection](docs/pawpals.postman_collection.json)

## Project Structure

```text
PawPals/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed-malaysia-vets.ts
│   └── seed-health-tips.ts
├── public/
│   └── uploads/
├── sample image/
│   └── UI preview screenshots
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── chats/
│   │   ├── discover/
│   │   ├── events/
│   │   ├── profile/
│   │   ├── stories/
│   │   └── vets/
│   ├── components/
│   ├── data/
│   ├── lib/
│   └── server/
├── images/
├── docs/
└── package.json
```

## Security & Privacy

- Passwords are hashed with bcryptjs.
- Authentication uses JWT.
- Protected endpoints require a valid user session.
- Private accounts restrict access to posts, followers, following, and chat.
- Users can only edit or delete their own content.
- Uploads are validated by file type and file size.

## Roadmap

- Real-time chat with WebSockets or server-sent events
- Push notifications
- Advanced PawPal matching algorithm
- Admin moderation dashboard
- Mobile app wrapper with Capacitor
- More accessibility and keyboard navigation improvements

## Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run tests and type checks.
5. Open a pull request with a clear description.

Recommended checks before opening a pull request:

```bash
npx tsc --noEmit
npm test
npm run build
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

Built by [Xid03](https://github.com/Xid03).

If you find this project useful or interesting, consider giving it a star on GitHub.
