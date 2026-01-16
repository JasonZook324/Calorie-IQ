# CalorieIQ - Smart Calorie & Weight Tracking

## Overview

CalorieIQ is a full-stack calorie and weight tracking application that helps users monitor their daily nutrition and weight trends. The app calculates maintenance calories, daily deficits, and provides rolling averages for calories and weight over 7 and 14-day periods. Users can log daily entries with calories, weight, and optional macros (protein, carbs, fat), then visualize their progress through interactive charts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable components in `client/src/components/`
- UI primitives in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- Shared utilities in `client/src/lib/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Authentication**: Session-based auth using Passport.js with local strategy
- **Password Security**: scrypt hashing with random salt
- **Session Storage**: PostgreSQL via connect-pg-simple

Key backend files:
- `server/index.ts` - Express app setup and middleware
- `server/routes.ts` - API route definitions
- `server/auth.ts` - Authentication configuration
- `server/storage.ts` - Database access layer
- `server/metrics.ts` - Calorie/weight calculation logic

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` using drizzle-orm
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Migrations**: Managed via `drizzle-kit push`

Database tables:
- `users` - User accounts with username/password
- `daily_entries` - Daily logs with calories, weight, and optional macros

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- Schema definitions and TypeScript types
- Zod validation schemas
- Calculated metrics type definitions

## External Dependencies

### Database
- **Neon PostgreSQL** - Primary database (connection via `NEON_DATABASE_URL` environment variable)
- **connect-pg-simple** - Session storage in PostgreSQL

### Authentication
- **Passport.js** - Authentication middleware
- **passport-local** - Username/password authentication strategy
- **express-session** - Session management

### Environment Variables Required
- `NEON_DATABASE_URL` - Neon PostgreSQL connection string (primary)
- `DATABASE_URL` - Fallback PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption

### Database Migrations
To push schema changes to the Neon database, run:
```bash
DATABASE_URL=$NEON_DATABASE_URL npm run db:push
```

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `recharts` - Chart visualization
- `date-fns` - Date manipulation
- `zod` - Runtime type validation