# FanPass — Digital Ticketing & Event Entry Management

FanPass is a mobile-first Progressive Web App (PWA) designed to digitize ticket sales, payment verification, and venue entry management for events in emerging markets (specifically optimized for Ethiopia).

It eliminates manual verification steps by connecting directly to payment providers (like Telebirr), issuing secure JWT-backed QR tickets, and validating entry through a robust, offline-capable scanner application.

## Prerequisites
- Node.js 18+
- PostgreSQL database (Local, Neon, Supabase, or Railway)
- Africa's Talking API key (for SMS delivery)

## Local Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Configuration**
   Copy the example environment file and add your credentials:
   \`\`\`bash
   cp .env.example .env.local
   # Ensure .env also contains the DATABASE_URL for Prisma
   \`\`\`
   Update `DATABASE_URL`, `NEXTAUTH_SECRET`, and `TICKET_JWT_SECRET`.

3. **Database Setup**
   Push the schema to your database:
   \`\`\`bash
   npx prisma db push
   \`\`\`

4. **Seed Database**
   Seed the database with a test organizer, event, and staff member:
   \`\`\`bash
   npm run db:seed
   \`\`\`

5. **Run the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000)

## How to Test Each User Flow

### 1. Organizer Flow
- Go to `/login`
- Enter the seeded Organizer phone: **+251911000001**
- Click "Continue" (OTP simulation runs in console, or enter any 6 digits in development bypass)
- You will be redirected to the **Organizer Dashboard** (`/dashboard`).
- Explore Event creation, live statistics monitoring, and Staff management.

### 2. Fan Purchase Flow
- From the Dashboard, view the Public Page for an active event (e.g., `/events/epl-arsenal-man-city-01`).
- Click "Buy Ticket".
- Enter a phone number.
- For testing without real Telebirr credentials, click the **"DEV: Simulate Direct Payment"** button.
- You will be redirected instantly to your generated Digital Ticket containing a QR Code.

### 3. Staff Scan Flow
- Open an incognito window or sign out.
- Go to `/login`.
- Enter the seeded Staff phone: **+251922000002**.
- You will be redirected to the **Scanner Portal** (`/scan`).
- Use your device camera to scan the QR code generated in the Fan Purchase flow.
- A "Valid Entry" success screen will appear. Scanning the same code again will display "Already Used".

## Payment Integration Notes (Telebirr)
The Telebirr STB integration is located at `src/server/payments/telebirr.ts`. 
To use the real sandbox/production flow:
1. Obtain `TELEBIRR_APP_ID`, `TELEBIRR_APP_KEY`, `TELEBIRR_SECRET`, and `TELEBIRR_SHORT_CODE`.
2. Add them to your environment variables.
3. Remove the `simulate` flag from the checkout flow in production. 

## Deployment Guide
- **Frontend & API:** Deploy directly to **Vercel** with zero-configuration needed.
- **Database:** Deploy your PostgreSQL database to **Neon**, **Railway**, or **Supabase**.
- Ensure all environment variables listed in `.env.example` are securely added to your Vercel project settings.

## Environment Variables Reference
- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: Secret used to encrypt NextAuth session cookies.
- `TICKET_JWT_SECRET`: Secret used to sign the QR code JWTs (DO NOT LOSE THIS, or old tickets will become invalid).
- `NEXT_PUBLIC_APP_URL`: The full production URL (e.g., `https://fanpass.vercel.app`).
