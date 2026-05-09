# FanPass — Master Build Prompt
### Production-Ready PWA for Digital Ticketing & Event Entry Management
---

## HOW TO USE THIS PROMPT

Paste this entire document into your AI coding assistant (Claude Code, Cursor, v0, Bolt, or similar). It is self-contained. The assistant will have everything it needs to scaffold and build the full application without asking you for clarification.

---

## 1. PROJECT OVERVIEW

You are building **FanPass** — a mobile-first Progressive Web App (PWA) that digitizes ticket sales, payment verification, and venue entry management for football watch parties and live entertainment events in emerging markets (Ethiopia first, East Africa second).

The core problem being solved: event organizers currently collect money via Telebirr or bank transfer, then door staff manually review payment screenshots at the entrance. This is slow, fraud-prone, and unscalable. FanPass eliminates every manual step by connecting directly to payment provider APIs, automatically verifying transactions, generating QR-code tickets instantly, and validating them at the door with a phone scan.

**One-line promise:** Pay once. Show up. Walk in.

---

## 2. TECH STACK

Use exactly this stack unless a specific section says otherwise.

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui component library. The app must be a fully installable PWA (add `next-pwa` or equivalent manifest + service worker configuration).

**Backend** — Next.js API Routes (same repo, full-stack). Use Server Actions where appropriate for form submissions. All business logic lives in `/src/server/` and is never imported directly into client components.

**Database** — PostgreSQL via Prisma ORM. Use `prisma/schema.prisma` for all data models.

**Authentication** — NextAuth.js v5 with credentials provider (phone number + OTP via SMS). Organizers and staff have accounts; attendees do not need one.

**QR Codes** — Generate with the `qrcode` npm package server-side. Encode a signed JWT payload (not raw ticket ID) so QR contents cannot be reverse-engineered or forged.

**SMS** — Africa's Talking SMS API for delivering ticket links and OTPs. Abstract behind a `/src/server/sms.ts` service so the provider can be swapped.

**Payment (Phase 1)** — Telebirr STB (Super App to Business) API. Abstract behind `/src/server/payments/telebirr.ts`. Design the abstraction so adding M-Pesa or CBE Birr later requires only a new file, not changes to core logic.

**Hosting target** — Vercel (frontend + API routes) + Supabase or Railway (PostgreSQL). All environment variables must be documented in `.env.example`.

---

## 3. USER ROLES & PERMISSIONS

There are exactly three roles. Enforce them with NextAuth session checks on every protected route and API endpoint.

**ORGANIZER** — Can create, edit, and close events. Sees the live organizer dashboard. Manages staff accounts for their events. Views revenue and attendance analytics. Receives payouts (tracked in the system, actual disbursement is manual in v1).

**STAFF (Scanner)** — Has a login. Can only access the scan page for events they are assigned to. Has no access to financial data, event editing, or other organizers' events.

**ATTENDEE** — No account required. Accesses the public event page via a shared link. Purchases a ticket. Receives their ticket at a URL. Shows QR at the door.

---

## 4. DATABASE SCHEMA

Implement this exact Prisma schema. Do not deviate from field names as they are referenced throughout this document.

```prisma
model Organizer {
  id        String   @id @default(cuid())
  phone     String   @unique
  name      String
  createdAt DateTime @default(now())
  events    Event[]
  staff     Staff[]
}

model Staff {
  id          String     @id @default(cuid())
  phone       String
  name        String
  organizer   Organizer  @relation(fields: [organizerId], references: [id])
  organizerId String
  assignments EventStaff[]
  scanLogs    ScanLog[]
  createdAt   DateTime   @default(now())
}

model Event {
  id              String       @id @default(cuid())
  organizer       Organizer    @relation(fields: [organizerId], references: [id])
  organizerId     String
  title           String
  description     String?
  venue           String
  venueMapUrl     String?
  dateTime        DateTime
  ticketPrice     Int          // stored in smallest currency unit (e.g., cents/santim)
  currency        String       @default("ETB")
  maxCapacity     Int
  ticketsSold     Int          @default(0)
  status          EventStatus  @default(DRAFT)
  paymentMethods  String[]     // ["TELEBIRR", "CBE_BIRR", "MPESA"]
  slug            String       @unique // used in public URL: /events/[slug]
  createdAt       DateTime     @default(now())
  tickets         Ticket[]
  staffAssignments EventStaff[]
}

enum EventStatus {
  DRAFT
  ACTIVE
  SOLD_OUT
  CLOSED
  CANCELLED
}

model Ticket {
  id           String       @id @default(cuid())
  event        Event        @relation(fields: [eventId], references: [id])
  eventId      String
  buyerPhone   String
  buyerName    String?
  qrToken      String       @unique // signed JWT
  status       TicketStatus @default(VALID)
  issuedAt     DateTime     @default(now())
  scannedAt    DateTime?
  scanLog      ScanLog?
  transaction  Transaction?
}

enum TicketStatus {
  VALID
  USED
  CANCELLED
  REFUNDED
}

model Transaction {
  id               String   @id @default(cuid())
  ticket           Ticket   @relation(fields: [ticketId], references: [id])
  ticketId         String   @unique
  provider         String   // "TELEBIRR" | "CBE_BIRR" | "MPESA"
  amount           Int
  currency         String
  providerRef      String?  // transaction ID from payment provider
  status           String   // "PENDING" | "CONFIRMED" | "FAILED"
  webhookPayload   Json?
  verifiedAt       DateTime?
  createdAt        DateTime @default(now())
}

model EventStaff {
  event     Event  @relation(fields: [eventId], references: [id])
  eventId   String
  staff     Staff  @relation(fields: [staffId], references: [id])
  staffId   String
  @@id([eventId, staffId])
}

model ScanLog {
  id        String   @id @default(cuid())
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  ticketId  String   @unique
  staff     Staff    @relation(fields: [staffId], references: [id])
  staffId   String
  result    String   // "VALID" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT"
  scannedAt DateTime @default(now())
  deviceInfo String?
}
```

---

## 5. APPLICATION PAGES & ROUTES

Build every route listed below. Routes marked **(protected)** must redirect unauthenticated users to `/login`.

### 5.1 Public Routes (no login required)

`/events/[slug]` — **Public Event Page**
The fan-facing page for a specific event. Shows: event title, match details, venue, date/time, ticket price, seats remaining (live, updated every 30 seconds via polling or SSE), and a prominent "Buy Ticket" button. If the event is sold out, show a "Sold Out" state. If the event is closed or cancelled, show an appropriate message. This page must load fast and look excellent on a 360px wide mobile screen.

`/events/[slug]/buy` — **Ticket Purchase Page**
A simple two-field form: buyer's name (optional) and phone number (required, used for ticket delivery). Below the form, show the available payment methods as selectable options with their logos. On submit, initiate the payment flow and redirect to the payment provider or show a pending state.

`/tickets/[ticketId]` — **Digital Ticket Page**
The page a fan lands on after their ticket is issued. Shows the event name, date, venue, buyer phone, ticket ID, and a large QR code. The QR code must be rendered large enough to scan easily (minimum 256×256px). Add a "Save to Home Screen" prompt. This page must work with the service worker so the ticket is cached and viewable offline after first load.

`/login` — **Login Page**
Phone number entry → OTP sent via SMS → OTP verification → session created. Used by both organizers and staff. After login, redirect to the appropriate dashboard based on role.

### 5.2 Organizer Routes (protected — ORGANIZER role only)

`/dashboard` — **Organizer Home**
Summary cards: total events, total tickets sold (all time), total revenue (all time). Recent events list with quick links to each event's detail page. Button to create a new event.

`/dashboard/events/new` — **Create Event**
Multi-step form (not multi-page; use a stepped UI within one page):
Step 1: Event details (title, description, venue, map URL, date, time).
Step 2: Ticket settings (price, max capacity, accepted payment methods — checkboxes).
Step 3: Review and publish. On publish, set status to ACTIVE and generate the slug (kebab-case of title + short random suffix). Show the shareable event link with a copy button.

`/dashboard/events/[eventId]` — **Event Detail & Live Monitor**
This is the most important organizer screen. It must show in real time (polling every 10 seconds or via SSE):
— Tickets sold vs. capacity (shown as a progress bar and numbers).
— Total revenue collected so far.
— Number of attendees who have entered (tickets scanned) vs. tickets sold.
— Full scan log table: timestamp, buyer phone, staff name, result (color-coded).
— Assigned staff list with ability to add or remove staff.
— An "End Event" button that closes ticket sales and locks the event.

`/dashboard/staff` — **Staff Management**
List of all staff accounts the organizer has created. Form to add a new staff member (name + phone). Each staff member shows which events they are currently assigned to.

### 5.3 Staff / Scanner Routes (protected — STAFF role only)

`/scan` — **QR Scanner Page**
This is the door staff's screen. It must:
1. Show a camera viewfinder that continuously scans for QR codes using the device camera (use `html5-qrcode` or `zxing-js/browser` library).
2. On successful decode, POST the QR token to `/api/tickets/validate`.
3. Display the result as a large, full-screen color flash: GREEN with a checkmark and the buyer's name for VALID; RED with an X and "Already Used" for USED; RED with an X and "Invalid Ticket" for anything else.
4. After 3 seconds, automatically reset and resume scanning.
5. The page must request camera permission gracefully and show a clear message if permission is denied.
6. Show which event is currently being scanned (staff are assigned to a specific event).

---

## 6. API ROUTES

Implement all of the following API endpoints under `/src/app/api/`.

`POST /api/auth/send-otp` — Generate a 6-digit OTP, store it with a 10-minute TTL (use a database table or Redis if available, otherwise in-memory Map for dev), and send it via the SMS service. Rate-limit to 3 requests per phone per 10 minutes.

`POST /api/auth/verify-otp` — Verify the OTP. On success, create a NextAuth session.

`POST /api/tickets/initiate` — Called when a fan clicks "Buy" and submits their phone number. Creates a Transaction record with status PENDING and a Ticket record with status VALID (but qrToken not yet set). Returns a payment redirect URL or payment instructions.

`POST /api/webhooks/telebirr` — Telebirr calls this endpoint when payment is confirmed. Validate the webhook signature. Find the matching Transaction by providerRef. Set Transaction status to CONFIRMED. Generate the signed QR JWT and set it on the Ticket. Send the ticket URL to the buyer via SMS. Return 200 to Telebirr. This endpoint must be idempotent — calling it twice for the same transaction must not issue two tickets.

`POST /api/tickets/validate` — Called by the scanner page. Accepts `{ qrToken: string, eventId: string }`. Verify the JWT signature. Look up the ticket. If VALID: update status to USED, create a ScanLog, return `{ result: "VALID", buyerName, buyerPhone }`. If USED: return `{ result: "ALREADY_USED" }`. If JWT is invalid or ticket not found: return `{ result: "INVALID" }`. If ticket belongs to a different event: return `{ result: "WRONG_EVENT" }`. This entire operation must be wrapped in a database transaction to prevent race conditions (two simultaneous scans of the same QR).

`GET /api/events/[eventId]/stats` — Returns live stats for the organizer dashboard: ticketsSold, capacity, totalRevenue, attendeesEntered, recentScans (last 20 scan log entries).

`POST /api/events` — Creates a new event. Organizer only.

`PATCH /api/events/[eventId]` — Updates event. Organizer only. Cannot update a CLOSED or CANCELLED event.

`POST /api/events/[eventId]/staff` — Assigns a staff member to an event. Organizer only.

`DELETE /api/events/[eventId]/staff/[staffId]` — Removes staff assignment. Organizer only.

---

## 7. PAYMENT INTEGRATION — TELEBIRR

Build the Telebirr integration in `/src/server/payments/telebirr.ts`. The integration must follow this design:

The file exports two functions: `initiatePayment(params)` and `verifyWebhook(payload, signature)`.

`initiatePayment` takes the event ID, ticket ID, amount, currency, and buyer phone. It calls Telebirr's STB initiation endpoint, which returns a payment URL or USSD push. Store the Telebirr reference in the Transaction record. Return the redirect URL to the frontend.

`verifyWebhook` validates that the incoming webhook is genuinely from Telebirr by checking the HMAC signature using the `TELEBIRR_SECRET` environment variable. Return a boolean.

All Telebirr credentials (`TELEBIRR_APP_ID`, `TELEBIRR_APP_KEY`, `TELEBIRR_SECRET`, `TELEBIRR_SHORT_CODE`) are read from environment variables. Never hardcode them.

Also create `/src/server/payments/index.ts` that exports a `getPaymentProvider(name: string)` function returning the correct provider module. This is the abstraction layer that makes adding M-Pesa later as simple as creating `/src/server/payments/mpesa.ts` with the same two functions.

---

## 8. QR CODE & TICKET SECURITY

Implement ticket security in `/src/server/tickets.ts`.

The QR code encodes a signed JWT with this payload:
```json
{
  "ticketId": "clxxx...",
  "eventId":  "clyyy...",
  "iat":      1234567890
}
```

Sign with `HS256` using the `TICKET_JWT_SECRET` environment variable (minimum 32 characters). Do not include an `exp` claim — tickets do not expire based on time, only on scan status.

The `validate` API route decodes and verifies the JWT first. If signature verification fails, return INVALID immediately without hitting the database. This prevents enumeration attacks.

---

## 9. PWA CONFIGURATION

The app must be a fully installable PWA. Configure the following:

`/public/manifest.json` — App name: "FanPass", short name: "FanPass", theme color: `#1A7A4A`, background color: `#0F1A14`, display: `standalone`, start URL: `/`, icons at 192×192 and 512×512 (use a simple green circle with "FP" text, generated as SVG and converted to PNG at build time or as a static asset).

Service worker — Cache the shell (layout, fonts, icons) and the ticket page (`/tickets/[ticketId]`) using a cache-first strategy. Use network-first for all API calls. The scanner page must not be cached (always fresh).

---

## 10. UI DESIGN SYSTEM

Use this exact design language throughout the entire application. Do not deviate.

**Brand colors:**
```css
--color-brand:        #1A7A4A;   /* Primary green */
--color-brand-dark:   #0F4D2E;   /* Dark green — hover states */
--color-brand-light:  #E8F5EE;   /* Pale green — backgrounds, tints */
--color-success:      #22C55E;   /* Scan valid */
--color-error:        #EF4444;   /* Scan invalid */
--color-surface:      #FFFFFF;
--color-bg:           #F8FAF9;
--color-text-primary: #111827;
--color-text-muted:   #6B7280;
--color-border:       #E5E7EB;
```

**Typography:** Import `Outfit` (headings, bold numerals) and `DM Sans` (body, UI text) from Google Fonts. Never use Inter, Roboto, or system-ui as the primary font.

**Component rules:**
— Buttons: `rounded-xl`, `font-semibold`, `tracking-wide`. Primary button uses `--color-brand` background with white text. Loading state shows a spinner and disables the button.
— Cards: `rounded-2xl`, `shadow-sm`, `border border-[--color-border]`, white background.
— Inputs: `rounded-xl`, `border-2`, focus ring in brand color.
— The scan result overlay (valid/invalid) is a full-screen modal with the color filling the entire viewport, a large icon (128px), and bold text. Animation: fade in over 200ms.

**Mobile-first:** Every page must look correct and professional at 360px width. The organizer dashboard is allowed to be desktop-optimized but must be usable on mobile. The scanner page and ticket page are phone-only and must feel like a native app.

---

## 11. ERROR HANDLING & EDGE CASES

Handle all of the following explicitly — do not leave them as unhandled states.

Payment timeout — If the payment webhook does not arrive within 30 minutes of ticket initiation, mark the Transaction as FAILED. The fan's pending page should poll `/api/tickets/[ticketId]/status` and show a "Payment not confirmed yet" message after 5 minutes with a support contact.

Double scan — The validate endpoint uses a database transaction with a row-level lock (`SELECT ... FOR UPDATE`) to ensure that two simultaneous scan requests for the same ticket cannot both return VALID.

Sold-out race condition — When initiating a ticket purchase, check `ticketsSold < maxCapacity` inside a database transaction and increment atomically. Return a "Sold out" error if capacity is reached between page load and purchase attempt.

Event not active — The `/events/[slug]/buy` page must check event status server-side on every load. If the event is not ACTIVE, redirect to `/events/[slug]` with an appropriate message.

Network failure on scan page — If the validate API call fails due to network error, show a yellow "Connection error — retrying..." state and retry up to 3 times before showing a "Cannot validate — check your connection" message. Do not show a false positive or false negative.

---

## 12. ENVIRONMENT VARIABLES

Document all of the following in `.env.example` with placeholder values and a comment explaining each one.

```
# Database
DATABASE_URL=postgresql://user:password@host:5432/fanpass

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-chars

# Ticket JWT
TICKET_JWT_SECRET=your-ticket-signing-secret-minimum-32-chars

# Telebirr
TELEBIRR_APP_ID=
TELEBIRR_APP_KEY=
TELEBIRR_SECRET=
TELEBIRR_SHORT_CODE=
TELEBIRR_BASE_URL=https://api.telebirr.com  # sandbox vs production

# Africa's Talking SMS
AT_API_KEY=
AT_USERNAME=
AT_SENDER_ID=FanPass

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 13. PROJECT FOLDER STRUCTURE

Scaffold the project with exactly this folder structure.

```
fanpass/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    # Seeds one organizer, one event, one staff member
├── public/
│   ├── manifest.json
│   └── icons/                     # 192.png, 512.png
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (public)/
│   │   │   ├── events/[slug]/
│   │   │   │   ├── page.tsx       # Public event page
│   │   │   │   └── buy/page.tsx   # Ticket purchase page
│   │   │   └── tickets/[ticketId]/page.tsx
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (organizer)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── events/
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [eventId]/page.tsx
│   │   │       └── staff/page.tsx
│   │   ├── (staff)/
│   │   │   └── scan/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── send-otp/route.ts
│   │       │   └── verify-otp/route.ts
│   │       ├── tickets/
│   │       │   ├── initiate/route.ts
│   │       │   ├── validate/route.ts
│   │       │   └── [ticketId]/status/route.ts
│   │       ├── events/
│   │       │   ├── route.ts
│   │       │   └── [eventId]/
│   │       │       ├── route.ts
│   │       │       ├── stats/route.ts
│   │       │       └── staff/
│   │       │           ├── route.ts
│   │       │           └── [staffId]/route.ts
│   │       └── webhooks/
│   │           └── telebirr/route.ts
│   ├── server/                    # Server-only logic (never imported in client components)
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config
│   │   ├── sms.ts                 # Africa's Talking abstraction
│   │   ├── tickets.ts             # QR generation, JWT sign/verify
│   │   └── payments/
│   │       ├── index.ts           # Provider factory
│   │       └── telebirr.ts        # Telebirr implementation
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── scanner/
│   │   │   ├── QRScanner.tsx
│   │   │   └── ScanResult.tsx
│   │   ├── tickets/
│   │   │   └── TicketCard.tsx
│   │   ├── events/
│   │   │   ├── EventCard.tsx
│   │   │   └── StatsPanel.tsx
│   │   └── layout/
│   │       ├── OrganizerNav.tsx
│   │       └── StaffNav.tsx
│   ├── lib/
│   │   ├── utils.ts               # cn(), formatCurrency(), formatDate()
│   │   └── constants.ts           # Payment method names, status labels
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── .env.example
├── .env.local                     # gitignored
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. SEED DATA

The `prisma/seed.ts` file must create the following records so the app can be tested immediately after setup:

One Organizer: name "Dawit Haile", phone "+251911000001".
One Event: title "EPL Match Night — Arsenal vs Man City", venue "Sky Lounge Hall, Bole", dateTime 48 hours from now, ticketPrice 15000 (150 ETB in santim), maxCapacity 200, status ACTIVE, paymentMethods ["TELEBIRR"], slug "epl-arsenal-man-city-01".
One Staff member: name "Selam Tadesse", phone "+251922000002", assigned to the above event.
Two Tickets in VALID status (no real transaction, for testing the scanner).

---

## 15. README

Generate a complete `README.md` with these sections: Project Overview, Prerequisites, Local Setup (step by step: clone, install, env setup, db migrate, seed, run), How to Test Each User Flow (organizer flow, fan purchase flow, staff scan flow), Payment Integration Notes (how to use Telebirr sandbox), Deployment Guide (Vercel + Railway/Supabase), Environment Variables Reference, and Contributing.

---

## 16. WHAT TO BUILD FIRST — RECOMMENDED ORDER

If building incrementally, follow this order so you always have a working, testable app at each stage.

1. Project scaffold (Next.js, Prisma, Tailwind, shadcn/ui, folder structure, `.env.example`).
2. Database schema and seed data. Confirm Prisma connects and seed runs.
3. Authentication (phone OTP login, NextAuth session, role-based redirects).
4. Public event page and ticket purchase page (UI only, no real payment yet — use a "simulate payment" button that directly triggers ticket generation for testing).
5. QR ticket generation and the digital ticket display page.
6. Staff scanner page (camera, decode, validate API, result overlay).
7. Organizer dashboard (event creation, live stats, staff management).
8. Real Telebirr webhook integration (replace the simulate button with real payment flow).
9. SMS delivery via Africa's Talking.
10. PWA manifest, service worker, offline ticket caching.
11. Polish: error states, edge cases (Section 11), mobile responsiveness audit.
12. Seed data, README, `.env.example` cleanup.

---

## FINAL NOTES FOR THE BUILDER

Every API route that modifies data must validate input with Zod before touching the database. Every protected route must check the session role server-side — do not rely only on client-side redirects. The scanner's validate endpoint is the most security-critical piece of the entire system; give it extra care (database transaction, idempotency, JWT verification before DB lookup). When in doubt about a design decision not covered here, choose the simpler option that can be extended later rather than the complex one that is hard to undo.

Build it so that a real football influencer in Addis Ababa can run their next watch party on it.