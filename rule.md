# Antigravity — Engineering Rules & System Boundaries

Version: 1.0  
Project Type: Event Ticketing & Crowd Access Platform  
Primary Goal: Fast, secure, scalable football/event entry management platform for local payment ecosystems.

---

# 1. Core Product Philosophy

Antigravity is NOT:
- a social media app
- a streaming platform
- a betting app
- a football news app
- a chat application

Antigravity IS:
- a payment-integrated event access platform
- a ticket verification system
- a crowd-entry management system
- an operational infrastructure product

All engineering decisions must support:
- reliability
- speed
- fraud prevention
- operational simplicity
- mobile-first usability

---

# 2. Architecture Rules

## REQUIRED STACK

### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS
- PWA-first design

### Backend
- NestJS
- REST API only for MVP
- Modular architecture required

### Database
- PostgreSQL

### ORM
- Prisma

---

# 3. Forbidden Architecture Decisions

DO NOT:
- use microservices
- use GraphQL
- introduce Kafka/RabbitMQ
- add Kubernetes
- implement CQRS/Event Sourcing
- use Firebase as primary backend
- mix frontend business logic with backend domain logic
- place critical logic inside frontend components
- use localStorage for sensitive auth/session data

MVP simplicity is mandatory.

---

# 4. Frontend Rules

## Frontend Responsibilities ONLY

Frontend may:
- render UI
- manage local UI state
- call backend APIs
- display validation errors
- scan QR codes
- cache non-sensitive offline data

Frontend must NOT:
- verify payments
- generate tickets
- validate ticket authenticity
- calculate payment authority
- implement security logic
- trust client-side ticket states

All sensitive logic belongs to backend.

---

# 5. Backend Rules

Backend owns:
- authentication
- authorization
- ticket lifecycle
- payment verification
- QR validation
- fraud prevention
- audit logging
- organizer permissions
- scan validation
- event state management

All business logic MUST live in NestJS modules/services.

---

# 6. Required Backend Module Structure

Required structure:

src/
├── auth/
├── users/
├── organizers/
├── events/
├── tickets/
├── payments/
├── scans/
├── notifications/
├── audit/
├── prisma/
├── common/
└── config/

DO NOT:
- place all logic inside app.module
- create giant services
- create generic "utils" dumping folders
- mix unrelated domains

---

# 7. Database Rules

## REQUIRED

- UUID primary keys
- createdAt/updatedAt timestamps
- soft delete where appropriate
- relational integrity enforced
- Prisma schema must remain normalized

## FORBIDDEN

DO NOT:
- store ticket state only in frontend
- duplicate payment data unnecessarily
- use JSON blobs instead of relations unless justified
- allow nullable security-critical fields
- use auto-increment IDs for public ticket references

---

# 8. Payment Rules

Payments are SECURITY-CRITICAL.

## REQUIRED

- all payment callbacks verified server-side
- webhook signature validation mandatory
- payment verification must be idempotent
- transaction reference uniqueness enforced
- payment logs preserved permanently

## FORBIDDEN

DO NOT:
- trust frontend payment success state
- issue tickets before confirmed verification
- expose payment secrets to frontend
- allow duplicate callback processing

---

# 9. Ticket Rules

Tickets are immutable access assets.

## REQUIRED

Ticket states:
- PENDING
- PAID
- ISSUED
- SCANNED
- EXPIRED
- REFUNDED

## REQUIRED

- QR codes generated server-side
- scan validation atomic
- duplicate scan detection mandatory
- scan timestamps stored

## FORBIDDEN

DO NOT:
- validate QR only client-side
- allow reusable scan sessions
- trust screenshot tickets alone

---

# 10. Authentication & Authorization Rules

## REQUIRED

- JWT/session auth handled securely
- role-based access control mandatory

Roles:
- SUPER_ADMIN
- ORGANIZER
- STAFF
- USER

## FORBIDDEN

DO NOT:
- store auth tokens insecurely
- expose admin APIs publicly
- bypass guards
- trust frontend roles

---

# 11. API Rules

## REQUIRED

All APIs must:
- use DTO validation
- return typed responses
- use consistent error structure
- follow REST conventions

## STANDARD RESPONSE FORMAT

Success:
{
  "success": true,
  "message": "",
  "data": {}
}

Error:
{
  "success": false,
  "message": "",
  "error": {}
}

---

# 12. UI/UX Rules

Antigravity is operational software.

UI priorities:
1. clarity
2. speed
3. accessibility
4. mobile responsiveness
5. low cognitive load

DO NOT:
- overuse animations
- build flashy football-themed UI
- sacrifice readability for aesthetics
- create complex navigation

The app must work under:
- crowd pressure
- poor lighting
- slow internet
- cheap Android phones

---

# 13. Offline & Connectivity Rules

System must tolerate unstable internet.

## REQUIRED LATER

- offline scan cache
- reconnect synchronization
- retry-safe operations

DO NOT assume stable venue connectivity.

---

# 14. Logging & Audit Rules

All critical actions must be logged.

Required logs:
- ticket scans
- payment verification
- ticket issuance
- organizer actions
- refunds
- permission changes

Audit logs are immutable.

---

# 15. Security Rules

## REQUIRED

- rate limiting
- input validation
- secure headers
- environment variable isolation
- backend validation for all sensitive operations

## FORBIDDEN

DO NOT:
- trust client payloads blindly
- expose internal IDs unnecessarily
- leak stack traces to production users
- hardcode secrets

---

# 16. Scalability Rules

Optimize for:
- maintainability first
- correctness second
- scale third

DO NOT prematurely optimize.

Avoid:
- distributed systems
- complex infra
- unnecessary abstractions

---

# 17. AI Assistant Restrictions

AI-generated code MUST:
- follow existing architecture
- preserve module boundaries
- avoid introducing new frameworks
- avoid unnecessary dependencies
- prefer readability over cleverness
- maintain TypeScript strictness
- avoid magic values
- use domain-driven naming

AI must NOT:
- rewrite entire architecture without request
- introduce experimental patterns
- bypass validation/security
- create oversized files
- create duplicate logic

---

# 18. Naming Conventions

## REQUIRED

Use:
- PascalCase for classes
- camelCase for variables/functions
- kebab-case for folders
- explicit domain naming

GOOD:
- TicketScanService
- verifyPaymentWebhook
- organizer-events.controller.ts

BAD:
- helper.ts
- stuff.service.ts
- dataManager.ts

---

# 19. MVP Discipline Rules

Current MVP includes ONLY:
- event creation
- payment integration
- ticket generation
- QR scanning
- attendee management
- organizer dashboard

DO NOT ADD:
- chat
- livestreaming
- betting
- social feeds
- AI recommendations
- fantasy football features

Focus on operational excellence first.

---

# 20. Final Engineering Principle

Antigravity is infrastructure software.

Every engineering decision must optimize for:
- trust
- reliability
- fraud resistance
- operational speed
- simplicity under pressure

Do not optimize for hype.
Optimize for systems that survive real-world event chaos.