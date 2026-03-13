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
- **Deployment**: Vercel (frontend), Supabase (database + auth + realtime)

### Backend Architecture
- **Runtime**: Node.js with Express.js (dev server only)
- **Language**: TypeScript with ESM modules
- **Production**: Frontend-only on Vercel; all data operations go directly to Supabase from the client

### Data Storage
- **Database**: Supabase (PostgreSQL)
- **Client Library**: @supabase/supabase-js for queries, inserts, and realtime subscriptions
- **Schema Location**: `shared/schema.ts` contains Drizzle table definitions (reference)
- **Tables**: 
  - `users` - User accounts with id, username, email, password, displayName, country, state
  - `messages` - Chat messages with userId, petType, breed, location, content, messageType, mediaUrl, mediaDuration

### Authentication
- **Provider**: Supabase Auth (email/password)
- **Client**: `src/lib/supabase.ts` creates the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Login**: `supabase.auth.signInWithPassword()` in `src/pages/login.tsx`
- **Signup**: `supabase.auth.signUp()` in `src/pages/signup.tsx` (stores username, country, state as user_metadata)
- **Session**: `supabase.auth.getSession()` in `src/hooks/use-auth.ts`
- **Logout**: `supabase.auth.signOut()`
- **Password Reset**: Manual via mailto link to scrollpet@gmail.com (MVP)

### Real-time Chat
- **Provider**: Supabase Realtime Channels (postgres_changes)
- **Hook**: `src/hooks/useWebSocket.ts` subscribes to INSERT events on the `messages` table
- **Message Fetch**: Supabase `select()` query with join to `users` table
- **Message Send**: Supabase `insert()` into `messages` table
- **Media Upload**: Supabase Storage bucket `chat-uploads` for images/video/audio

### Project Structure
```
├── index.html        # Entry point (root level for Vercel)
├── src/              # React frontend application
│   ├── components/   # UI components (shadcn/ui, ChatInput, MessageBubble, etc.)
│   ├── pages/        # Route page components
│   ├── hooks/        # Custom React hooks (use-auth, useWebSocket)
│   ├── lib/          # Utilities (supabase client, queryClient, utils)
│   └── data/         # Static data (indiaLocations, petBreeds)
├── server/           # Express dev server
│   ├── index.ts      # Server entry point
│   ├── vite.ts       # Vite dev middleware (points to root index.html)
│   ├── routes.ts     # API routes
│   └── storage.ts    # Database access layer
├── shared/           # Shared code
│   └── schema.ts     # Drizzle schema definitions
└── db/               # Database connection setup
```

### Path Aliases
- `@/*` → `src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

## External Dependencies

### Supabase
- **Database**: PostgreSQL hosted on Supabase
- **Auth**: Supabase Auth for email/password authentication
- **Realtime**: Supabase Channels for live chat subscriptions
- **Storage**: Supabase Storage for media file uploads
- **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Key NPM Packages
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod resolvers
- **Data**: TanStack React Query, date-fns
- **Auth/Realtime**: @supabase/supabase-js
- **Database (dev)**: pg (PostgreSQL client), drizzle-orm
