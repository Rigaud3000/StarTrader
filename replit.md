# MT5 Trading Bot Dashboard

## Overview

This is a professional MetaTrader 5 (MT5) trading bot dashboard with backtesting, machine learning insights, and real-time trading capabilities. The application provides a comprehensive trading platform interface for managing automated trading strategies, viewing trade history, analyzing performance metrics, and connecting to MT5 trading accounts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for a professional trading platform aesthetic
- **Charts**: Recharts for data visualization (equity curves, performance charts)
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based architecture with these main sections:
- Dashboard (overview metrics and charts)
- Strategies (trading strategy management)
- Backtesting (historical strategy testing)
- Live Trading (real-time trade execution)
- Trading Journal (trade notes and insights)
- ML Insights (machine learning predictions)
- Settings (MT5 connection configuration)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Style**: RESTful JSON API endpoints under `/api/`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod with drizzle-zod for type-safe validation

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - contains table definitions and TypeScript types
- **Migrations**: Drizzle Kit for database migrations (`npm run db:push`)

Key data models:
- Users (authentication)
- MT5Config (broker connection settings)
- Strategies (trading algorithms)
- BacktestResults (historical test outcomes)
- Trades (executed positions)
- JournalEntries (trading notes)
- MLInsights (prediction data)

### Build and Development
- **Development**: `npm run dev` - runs Vite dev server with HMR
- **Production Build**: `npm run build` - builds client with Vite, bundles server with esbuild
- **Type Checking**: `npm run check` - TypeScript validation

### Project Structure
```
client/           # React frontend application
  src/
    components/   # Reusable UI components (shadcn/ui)
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Data access layer interface
  static.ts       # Static file serving
shared/           # Shared code between client/server
  schema.ts       # Database schema and types
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Recharts**: Data visualization for trading charts
- **date-fns**: Date formatting and manipulation
- **wouter**: Client-side routing

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety across the stack

### Trading Platform Integration
- **MT5 Connection**: The application is designed to connect to MetaTrader 5 trading accounts using login credentials, password, and server configuration. The actual MT5 bridge implementation would require a separate Python/Windows service (referenced in attached_assets env files).