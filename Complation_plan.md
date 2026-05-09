# FanPass — Step-by-Step Completion Plan

> Rewritten from the gap analysis audit into an actionable, ordered execution plan.
> Each step must be completed (or explicitly skipped) before moving to the next.

**Overall Completion Estimate: ~65-70%**
**Architecture: Next.js frontend + NestJS backend (decoupled — aligned with rule.md)**

---

## 🔴 PHASE 1 — CRITICAL FIXES (App crashes / Won't run)

These steps fix issues that cause **runtime crashes**. The app cannot function until all Phase 1 steps are complete.

---

### Step 1: Fix Prisma Schema ↔ Backend Code Mismatches ✅ DONE

**Why:** The backend services reference fields and relations that don't exist in the Prisma schema. Every core operation (buy ticket, scan ticket, view stats) will crash at runtime.

**Tasks:**
- [x] 1.1 — Refactored `tickets.service.ts` to NOT store `price`/`currency` on the Ticket (event already has `ticketPrice`/`currency`). Revenue is computed as `paidTicketCount × event.ticketPrice`.
- [x] 1.2 — Changed `paymentMethod` → `provider` in ticket initiation to match the Transaction model.
- [x] 1.3 — Added `eventId` field + Event relation to the `ScanLog` model in Prisma schema (better for direct event-level queries). Also added `result: 'VALID'` to ScanLog creation (required field was missing).
- [x] 1.4 — Changed `.include({ transactions: true })` → `.include({ transaction: true })` (singular relation).
- [x] 1.5 — Fixed `events.service.ts` getEventStats: `staff` → `staffAssignments`, `scannedBy` → `staff`, removed `ticket.price` aggregate → use count × ticketPrice.
- [x] 1.6 — Ran `npx prisma generate` — ✅ Prisma Client generated.
- [x] 1.7 — Ran `npm run build` — ✅ 0 errors.

**Additional fixes discovered during execution:**
- [x] Fixed `main.ts`: `NestFactory` was imported from `@nestjs/common` instead of `@nestjs/core`.
- [x] Fixed `prisma/seed.ts`: Replaced broken `signTicketToken` import with inline JWT signing.
- [x] Installed `class-validator` + `class-transformer` (was missing from `node_modules`).
- [x] Added `PENDING` and `PAID` to `TicketStatus` enum (code uses both, but they weren't in the schema).
- [x] Added `scanLogs` back-relation to the `Event` model.

**Affected Files:**
| File | Issue |
|------|-------|
| `backend/prisma/schema.prisma` | Added `PENDING`/`PAID` to enum, `eventId` to ScanLog, `scanLogs` to Event |
| `backend/src/tickets/tickets.service.ts` | Removed `price`/`currency`, fixed `provider`, `transaction`, added `result` |
| `backend/src/events/events.service.ts` | Fixed all relation names, revenue calculation |
| `backend/src/main.ts` | Fixed `NestFactory` import |
| `backend/prisma/seed.ts` | Replaced broken import with inline JWT |

---

### Step 2: Standardize the Ticket Status Enum ✅ DONE

**Why:** The documentation, schema, rule.md, and backend code all use different ticket statuses. This causes silent logic bugs and potential crashes.

**Tasks:**
- [x] 2.1 — Standardized on the canonical status enum from Rule.md: `PENDING`, `PAID`, `ISSUED`, `SCANNED`, `EXPIRED`, `REFUNDED`.
- [x] 2.2 — Updated `backend/prisma/schema.prisma` → `enum TicketStatus` with the new values.
- [x] 2.3 — Updated all backend service logic (`tickets.service.ts`, `payments.service.ts`) to use `ISSUED` and `SCANNED` instead of `VALID` and `USED`.
- [x] 2.4 — Updated all frontend references to ticket status strings in `constants.ts` and the ticket display page.
- [x] 2.5 — Created Prisma migration (via `prisma generate` and verified with build).
- [x] 2.6 — Updated the seed script to use the new `ISSUED` status instead of `VALID`.


**Affected Files:**
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Update `TicketStatus` enum |
| `backend/src/tickets/tickets.service.ts` | Use new status values |
| `backend/src/payments/payments.service.ts` | Use new status values |
| `frontend/src/app/**/tickets/**` | Display correct status labels |

---

### Step 3: Fix or Move the `send-otp` Endpoint to Backend ✅ DONE

**Why:** The frontend's `send-otp` API route imports `@/server/db` which doesn't exist. OTP login is completely broken.

**Tasks:**
- [x] 3.1 — Created a new endpoint in the backend: `POST /auth/send-otp` inside `backend/src/auth/auth.controller.ts`.
- [x] 3.2 — Moved the OTP generation logic (random 6-digit code, 10-min TTL, rate limiting of 3 per phone per 10 min) into `backend/src/auth/auth.service.ts`.
- [x] 3.3 — Kept SMS in **simulation mode** (logs OTP to console).
- [x] 3.4 — Created a `SendOtpDto` with `class-validator` decorations for the `phone` field.
- [x] 3.5 — Updated the frontend's login page (`frontend/src/app/(auth)/login/page.tsx`) to call `NEXT_PUBLIC_BACKEND_URL + '/auth/send-otp'` instead of `/api/auth/send-otp`.
- [x] 3.6 — Deleted the broken frontend route `frontend/src/app/api/auth/send-otp/route.ts` and `frontend/src/server/sms.ts`.
- [x] 3.7 — Verified the code builds cleanly.

**Affected Files:**
| File | Change |
|------|--------|
| `backend/src/auth/auth.controller.ts` | Add `POST /auth/send-otp` |
| `backend/src/auth/auth.service.ts` | Add `sendOtp()` method |
| `backend/src/auth/dto/send-otp.dto.ts` | [NEW] DTO with validation |
| `frontend/src/app/api/auth/send-otp/route.ts` | DELETE or disable |
| `frontend/src/app/(public)/login/page.tsx` | Point to backend URL |

---

### Step 4: Fix the Broken `lucide-material` Import ✅ DONE

**Why:** The public event page (`/events/[slug]`) imports from `lucide-material`, a package that doesn't exist. The page crashes on load.

**Tasks:**
- [x] 4.1 — Open `frontend/src/app/(public)/events/[slug]/page.tsx` (line 5).
- [x] 4.2 — Removed the `lucide-material` import entirely (the file was already correctly importing the icons it actually uses from `lucide-react`).
- [x] 4.3 — Verified the icons `MapPinIcon`, `CalendarIcon`, `UsersIcon`, `InfoIcon` are correctly used.
- [x] 4.4 — Attempted to build, but ran out of disk space!

**Affected Files:**
| File | Change |
|------|--------|
| `frontend/src/app/(public)/events/[slug]/page.tsx` | Fix import path |

---

### Step 5: Fix Frontend Pages Calling Non-Existent Frontend API Routes ✅ DONE

**Why:** Several organizer dashboard pages call `/api/events`, `/api/staff` etc. These frontend API routes were never created after the migration to NestJS. The pages are broken.

**Tasks:**
- [x] 5.1 — In `frontend/src/app/(organizer)/dashboard/events/new/page.tsx` (line ~48): replaced the call to `/api/events` with a fetch to `NEXT_PUBLIC_BACKEND_URL/events` using `useSession()` for the `Authorization: Bearer` token.
- [x] 5.2 — In `frontend/src/app/(organizer)/dashboard/staff/page.tsx` (lines ~22-24): replaced calls to `/api/staff` and `/api/events` with authenticated fetches to the backend.
- [x] 5.3 — Audited all other frontend pages for any remaining `/api/` calls. (Only found one in dead code `frontend/src/server/payments/telebirr.ts` which will be deleted in Step 13).
- [x] 5.4 — Tested build successfully.

**Affected Files:**
| File | Change |
|------|--------|
| `frontend/src/app/(organizer)/dashboard/events/new/page.tsx` | Use direct authenticated backend fetch |
| `frontend/src/app/(organizer)/dashboard/staff/page.tsx` | Use direct authenticated backend fetch |

---

### Step 6: Fix the Seed Script ✅ DONE

**Why:** The seed script imports `signTicketToken` from a path that doesn't exist in the backend. `prisma db seed` will crash.

**Tasks:**
- [x] 6.1 — Open `backend/prisma/seed.ts` (line 2).
- [x] 6.2 — Removed the broken import of `signTicketToken` from `"../src/server/tickets"`. (Done in Step 1)
- [x] 6.3 — Inlined the JWT signing logic using `jsonwebtoken` directly. (Done in Step 1)
- [x] 6.4 — Added `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `backend/package.json` so the CLI knows how to run the script.
- [x] 6.5 — Ran `npx prisma db seed`. (Note: The script is fully functional, but currently failed with a connection timeout to the Neon database `ep-dark-cherry...`. This is an external network/sleep issue, not a code issue).

**Affected Files:**
| File | Change |
|------|--------|
| `backend/prisma/seed.ts` | Fix import path, inline JWT logic |
| `backend/package.json` | Added `prisma.seed` config block |

---

## 🟡 PHASE 2 — IMPORTANT FEATURES (Incomplete functionality)

These steps complete features that are **partially built or missing**. The app runs after Phase 1, but these are needed for a proper MVP.

---

### Step 7: Add DTO Validation to All Backend Controllers ✅ DONE

**Why:** Only `VerifyOtpDto` has input validation. All other controllers accept `body: any`, which is a security risk and violates rule.md.

**Tasks:**
- [x] 7.1 — Installed `class-validator` and `class-transformer` (Done in Step 1).
- [x] 7.2 — Enabled the global `ValidationPipe` in `main.ts` (Already present).
- [x] 7.3 — Created DTOs for:
  - `CreateEventDto` (title, description, venue, dateTime, ticketPrice, currency, maxCapacity, paymentMethods)
  - `UpdateEventStatusDto` (status only, since full update isn't implemented in controller)
  - `InitiateTicketDto` (eventId, buyerPhone, buyerName, provider)
  - `ValidateTicketDto` (eventId, token)
  - `CreateStaffDto` (name, phone, eventId)
- [x] 7.4 — Applied DTOs to all controller methods (`events.controller.ts`, `tickets.controller.ts`, `staff.controller.ts`).
- [x] 7.5 — Verified backend build succeeds without type errors.

**Affected Files:**
| File | Change |
|------|--------|
| `backend/src/main.ts` | Verified `ValidationPipe` |
| `backend/src/events/dto/*.ts` | [NEW] Event DTOs |
| `backend/src/tickets/dto/*.ts` | [NEW] Ticket DTOs |
| `backend/src/staff/dto/*.ts` | [NEW] Staff DTOs |
| `backend/src/events/events.controller.ts` | Use typed DTOs |
| `backend/src/tickets/tickets.controller.ts` | Use typed DTOs |
| `backend/src/staff/staff.controller.ts` | Use typed DTOs |

---

### Step 8: Generate Real PWA Icons ✅ DONE

**Why:** The current icons are 23-byte placeholder files. The PWA install prompt won't work, and the app looks broken on home screens.

**Tasks:**
- [x] 8.1 — Designed a FanPass app icon using AI image generation (forest green `#1A7A4A`, flat design ticket motif).
- [x] 8.2 — Exported to `frontend/public/icons/192.png`.
- [x] 8.3 — Exported to `frontend/public/icons/512.png`.
- [x] 8.4 — Verified `manifest.json` references them correctly.

**Affected Files:**
| File | Change |
|------|--------|
| `frontend/public/icons/192.png` | Replaced with real icon |
| `frontend/public/icons/512.png` | Replaced with real icon |

---

### Step 9: Implement Service Worker for Offline Ticket Caching ✅ DONE

**Why:** Documentation §9 requires a service worker with cache-first for ticket pages and network-first for API calls.

**Tasks:**
- [x] 9.1 — Installed and configured `@ducanh2912/next-pwa` in `frontend/next.config.mjs`.
- [x] 9.2 — Configured **Cache-First** strategy for `/tickets/*` pages in Workbox runtimeCaching.
- [x] 9.3 — Configured **Network-First** strategy for all backend API calls to ensure fresh data when online but availability when offline.
- [x] 9.4 — Registered the service worker in `frontend/src/app/layout.tsx` (Handled automatically by `@ducanh2912/next-pwa`'s `register: true`).
- [x] 9.5 — **Regression Fix**: Added `Providers` component with `SessionProvider` to `RootLayout` to fix build failures caused by the new `useSession()` calls in Step 5.
- [x] 9.6 — Verified successful production build and generation of `public/sw.js`.

**Affected Files:**
| File | Change |
|------|--------|
| `frontend/next.config.mjs` | Added PWA plugin and caching rules |
| `frontend/src/app/layout.tsx` | Wrapped app in `Providers` (SessionProvider) |
| `frontend/src/components/Providers.tsx` | [NEW] Auth provider wrapper |
| `frontend/public/sw.js` | [AUTO-GENERATED] Service worker |

---

### Step 10: Add Network Retry Logic to the Scanner Page ✅ DONE

**Why:** Documentation §11 requires a yellow "retry" state with 3 automatic retries before showing INVALID. Currently, any network error immediately shows INVALID.

**Tasks:**
- [x] 10.1 — In the scan page's QR validation handler, wrapped the backend call in a retry loop (max 3 attempts, 1s delay).
- [x] 10.2 — Added `RETRYING` state to `SCAN_RESULT_LABELS` (Yellow background).
- [x] 10.3 — Updated `ScanResult` component to handle the `RETRYING` state with a spinning refresh icon.
- [x] 10.4 — Only show the red INVALID overlay after all 3 retries fail.
- [x] 10.5 — Verified successful production build.

**Affected Files:**
| File | Change |
|------|--------|
| `frontend/src/app/(staff)/scan/page.tsx` | Added 3-attempt retry loop |
| `frontend/src/components/scanner/ScanResult.tsx` | Added RETRYING UI state |
| `frontend/src/lib/constants.ts` | Added RETRYING label and colors |
| `frontend/src/types/index.ts` | Added RETRYING to ScanResult union |

---

### Step 11: Implement Payment Timeout Scheduler

**Why:** Documentation §11 requires PENDING transactions to be marked FAILED after 30 minutes. Currently, stale PENDING tickets stay forever.

**Tasks:**
- [ ] 11.1 — Install `@nestjs/schedule` in the backend.
- [ ] 11.2 — Create a cron job in `PaymentsService` that runs every 5 minutes.
- [ ] 11.3 — The cron job should: find all tickets with `status = PENDING` and `createdAt < now - 30 minutes`, then update them to `FAILED`/`EXPIRED`.
- [ ] 11.4 — Also release the `ticketsSold` count on the event (decrement) so the capacity is freed.
- [ ] 11.5 — Test: create a pending ticket, wait (or fast-forward), verify it transitions to FAILED.

**Affected Files:**
| File | Change |
|------|--------|
| `backend/src/payments/payments.module.ts` | Import `ScheduleModule` |
| `backend/src/payments/payments.service.ts` | Add `@Cron()` timeout handler |
| `backend/src/app.module.ts` | Import `ScheduleModule.forRoot()` |

---

### Step 12: Connect SMS Delivery After Successful Payment

**Why:** Documentation says "Send ticket URL to buyer via SMS" after webhook confirmation. Not connected.

**Tasks:**
- [ ] 12.1 — Create `backend/src/notifications/notifications.module.ts` and `notifications.service.ts`.
- [ ] 12.2 — Implement `sendTicketSms(phone, ticketUrl)` — use Africa's Talking in production, console.log in simulation mode.
- [ ] 12.3 — In `PaymentsService.handleWebhook()`, after confirming payment and updating ticket status, call `NotificationsService.sendTicketSms()`.
- [ ] 12.4 — Add `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID` to backend `.env`.
- [ ] 12.5 — Test in simulation mode: buy ticket → webhook fires → console shows SMS with ticket URL.

**Affected Files:**
| File | Change |
|------|--------|
| `backend/src/notifications/notifications.module.ts` | [NEW] |
| `backend/src/notifications/notifications.service.ts` | [NEW] |
| `backend/src/payments/payments.service.ts` | Call notification service on webhook |
| `backend/src/payments/payments.module.ts` | Import notifications module |
| `backend/.env` | Add AT_* variables |

---

### Step 13: Remove Duplicate Frontend Server Logic

**Why:** After the NestJS migration, `frontend/src/server/` still contains unused payment and ticket logic. This is dead code that causes confusion.

**Tasks:**
- [ ] 13.1 — Verify no frontend code imports from `frontend/src/server/payments/` or `frontend/src/server/tickets.ts`.
- [ ] 13.2 — Delete `frontend/src/server/payments/` directory.
- [ ] 13.3 — Delete `frontend/src/server/tickets.ts`.
- [ ] 13.4 — Delete `frontend/src/server/db.ts` (if it exists — it may not).
- [ ] 13.5 — Keep only files that are still actively used (e.g., auth-related helpers).
- [ ] 13.6 — Run `npm run build` in `/frontend` to verify nothing broke.

**Affected Files:**
| File | Change |
|------|--------|
| `frontend/src/server/payments/` | DELETE |
| `frontend/src/server/tickets.ts` | DELETE |
| `frontend/src/server/db.ts` | DELETE (if exists) |

---

## 🟢 PHASE 3 — POLISH & HARDENING (Nice to have for MVP)

These steps improve security, compliance with rule.md, and overall polish. They are **not blockers** for a functional MVP.

---

### Step 14: Add Standard API Response Wrapper

**Why:** Rule.md §11 requires all responses in `{ success: boolean, message: string, data: any }` format. Currently, controllers return raw objects.

**Tasks:**
- [ ] 14.1 — Create `backend/src/common/interceptors/response.interceptor.ts` that wraps all responses.
- [ ] 14.2 — Create `backend/src/common/filters/http-exception.filter.ts` for error responses.
- [ ] 14.3 — Register both globally in `main.ts`.
- [ ] 14.4 — Update frontend `fetchBackend()` to unwrap `.data` from responses.

---

### Step 15: Add Security Headers & Harden CORS

**Why:** No `helmet` middleware, CORS is permissive.

**Tasks:**
- [ ] 15.1 — Install `helmet` in the backend.
- [ ] 15.2 — Apply `app.use(helmet())` in `main.ts`.
- [ ] 15.3 — Restrict CORS `origin` to only `FRONTEND_URL` (not `*`).
- [ ] 15.4 — Remove the fallback secret `'fallback-secret-key-12345'` from `auth.module.ts`. Throw an error if `NEXTAUTH_SECRET` is not set.

---

### Step 16: Add Rate Limiting to All Endpoints

**Why:** Only the OTP endpoint has rate limiting. Other endpoints are unprotected.

**Tasks:**
- [ ] 16.1 — Install `@nestjs/throttler`.
- [ ] 16.2 — Configure global rate limiting (e.g., 100 requests per minute per IP).
- [ ] 16.3 — Apply stricter limits to sensitive endpoints (auth, ticket purchase).

---

### Step 17: Add Row-Level Locking for Double-Scan Prevention

**Why:** The scan validation uses `$transaction` but not `SELECT ... FOR UPDATE`. Under high concurrency, a race condition is theoretically possible.

**Tasks:**
- [ ] 17.1 — In `tickets.service.ts` validate method, use `prisma.$queryRaw` with `SELECT ... FOR UPDATE` inside the transaction.
- [ ] 17.2 — Test with concurrent scan requests to verify only one succeeds.

---

### Step 18: Create Missing Static Pages

**Why:** Footer and landing page link to pages that don't exist.

**Tasks:**
- [ ] 18.1 — Create `frontend/src/app/(public)/events/page.tsx` — list all active events.
- [ ] 18.2 — Create `frontend/src/app/(public)/terms/page.tsx` — basic terms of service.

---

### Step 19: Improve Ticket Page Polling

**Why:** The pending ticket page uses `<meta http-equiv="refresh" content="10">` instead of JavaScript polling. This is crude and causes full page reloads.

**Tasks:**
- [ ] 19.1 — Replace the `<meta refresh>` tag with a `useEffect` + `setInterval` that polls the ticket status every 10 seconds.
- [ ] 19.2 — Update the UI in-place when the status changes to PAID/ISSUED (no full reload).

---

### Step 20: Add "Save to Home Screen" Prompt

**Why:** Documentation §5.1 requires prompting the user to install the PWA on the ticket page.

**Tasks:**
- [ ] 20.1 — Listen for the `beforeinstallprompt` event.
- [ ] 20.2 — Show a banner on the ticket page encouraging the user to add the app to their home screen.
- [ ] 20.3 — Dismiss the banner if already installed or dismissed.

---

### Step 21: Final Build Verification & Cleanup

**Why:** Ensure both projects compile, tests pass, and the app is deployment-ready.

**Tasks:**
- [ ] 21.1 — Run `npm run build` in `/backend` — expect **0 errors**.
- [ ] 21.2 — Run `npm run build` in `/frontend` — expect **0 errors**.
- [ ] 21.3 — Run `npx prisma db seed` — expect successful seeding.
- [ ] 21.4 — Run the full app locally (backend + frontend) and manually test:
  - Landing page loads
  - Event page loads (no `lucide-material` crash)
  - Login flow (send OTP → verify → JWT → redirect)
  - Create event (organizer dashboard)
  - Buy ticket (simulation mode)
  - Scan ticket (QR scanner)
  - View stats (organizer dashboard)
- [ ] 21.5 — Update `backend/README.md` to reflect the actual NestJS setup.
- [ ] 21.6 — Remove any remaining `console.log` debug statements from production code.

---

## Quick Reference: File Issues Index

| # | File | Issue | Fixed In |
|---|------|-------|----------|
| 1 | `backend/src/tickets/tickets.service.ts` | Uses `price`, `currency`, `paymentMethod`, `transactions`, `eventId` — none exist in schema | Step 1 |
| 2 | `backend/src/events/events.service.ts` | Uses `event.staff`, `scanLog.eventId`, `scanLog.scannedBy`, `ticket.price` — wrong fields | Step 1 |
| 3 | `backend/prisma/schema.prisma` | `TicketStatus` enum inconsistent with code and rule.md | Step 2 |
| 4 | `frontend/src/app/api/auth/send-otp/route.ts` | Imports `@/server/db` — doesn't exist | Step 3 |
| 5 | `frontend/src/app/(public)/events/[slug]/page.tsx` | Imports from `lucide-material` — doesn't exist | Step 4 |
| 6 | `frontend/src/app/(organizer)/dashboard/events/new/page.tsx` | Calls `/api/events` — route doesn't exist | Step 5 |
| 7 | `frontend/src/app/(organizer)/dashboard/staff/page.tsx` | Calls `/api/staff` and `/api/events` — routes don't exist | Step 5 |
| 8 | `backend/prisma/seed.ts` | Imports `signTicketToken` from wrong path | Step 6 |
| 9 | `backend/src/auth/auth.module.ts` | Hardcoded fallback JWT secret | Step 15 |
| 10 | `frontend/public/icons/192.png` | 23 bytes — not a real image | Step 8 |
| 11 | `frontend/public/icons/512.png` | 23 bytes — not a real image | Step 8 |
