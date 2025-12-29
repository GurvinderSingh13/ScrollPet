# ScrollPet

## Overview

ScrollPet is a real-time community platform for pet lovers. Users can join chat rooms organized by pet type (dogs, cats, fish, birds, etc.) and location (global, country, state, district). The platform enables pet enthusiasts to connect, share experiences, and discuss topics related to their favorite animals in a trusted community environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Typography**: Montserrat font family via Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: REST endpoints under `/api` prefix
- **Real-time Communication**: WebSocket server (ws library) for live chat messaging
- **Build Process**: Custom build script using esbuild for server and Vite for client

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains database table definitions
- **Tables**: 
  - `users` - User accounts with id, username, password, displayName
  - `messages` - Chat messages with userId, petType, location, content

### Authentication
- **Current State**: Simple localStorage-based login simulation
- **Session Support**: connect-pg-simple configured for PostgreSQL session storage (available for future implementation)

### Project Structure
```
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── pages/          # Route page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API routes and WebSocket setup
│   ├── storage.ts    # Database access layer
│   └── static.ts     # Static file serving
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema definitions
└── db/               # Database connection setup
```

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `/migrations` directory

### Third-Party Services
- None currently integrated, but infrastructure supports:
  - Stripe (payment processing)
  - OpenAI/Google Generative AI (AI features)
  - Nodemailer (email)

### Key NPM Packages
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod resolvers
- **Data**: TanStack React Query, date-fns
- **Real-time**: ws (WebSocket library)
- **Database**: pg (PostgreSQL client), drizzle-orm