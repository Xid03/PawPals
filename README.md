# PawPals

PawPals is a playful mobile-first cat social app prototype built with Next.js, React, TypeScript, and Tailwind CSS. It uses mock data only and is structured so it can later be wrapped with Capacitor for iOS and Android.

## Features

- Onboarding, auth, home, discover, cat profile, community feed, stories, vets, vet detail, chat, create post, and user profile routes
- Reusable UI components for navigation, cards, chips, buttons, headers, posts, vets, and stories
- Soft PawPals theme with pastel peach, pink, cream, and lavender colors
- Mobile app style shell centered on desktop
- Mock cats, posts, stories, vets, chat messages, and user data

## Getting Started

Install dependencies:

```bash
npm install
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

## Capacitor Readiness

The app keeps routes and UI inside the Next.js project and avoids backend dependencies. When you are ready to wrap it with Capacitor, configure static export or an appropriate mobile hosting strategy, then add the Capacitor native platforms.
