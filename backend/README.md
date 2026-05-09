# FanPass Backend — Production API

The core API for the FanPass digital ticketing platform, built with **NestJS**, **Prisma**, and **PostgreSQL**.

## Tech Stack
- **Framework**: NestJS (v11)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Security**: Helmet, Rate Limiting (Throttler), JWT
- **Scheduling**: Native NestJS Schedule for automated ticket expiration

## Getting Started

### 1. Prerequisites
- Node.js (v20+)
- PostgreSQL instance

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-jwt-secret"
FRONTEND_URL="http://localhost:3000"
TICKET_JWT_SECRET="your-ticket-signing-secret"
```

### 4. Database Setup
```bash
npx prisma db push
npx prisma db seed
```

### 5. Running the API
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Architecture Notes
- **Standardized Responses**: All API responses follow the `{ success: boolean, message: string, data: any }` pattern via `ResponseInterceptor`.
- **Global Error Handling**: `HttpExceptionFilter` ensures all errors are returned in a consistent JSON format.
- **Security**:
  - `Helmet` is enabled for secure headers.
  - CORS is restricted to the authorized `FRONTEND_URL`.
  - Rate limiting is applied globally (100 req/min) with stricter limits on auth and ticket initiation.
- **Atomic Operations**: Row-level locking (`FOR UPDATE`) is used during ticket scanning to prevent double-entry fraud.

## License
FanPass is UNLICENSED.

