# FanPass Role & Authorization Framework

This document defines the roles, privileges, and implementation steps for the FanPass platform RBAC system, based on the approved proposal.

## 1. Role Definitions

### SUPER_ADMIN (Platform Administrator)
- **Logic**: Full platform oversight and management.
- **Key Features**:
  - Manage all organizers (Suspend/Ban/Activate).
  - View platform-wide revenue, GMV, and commission.
  - Oversee all events, tickets, and transactions.
  - Resolve attendee disputes and issue refunds globally.
  - Configure payment provider credentials.

### ORGANIZER (Event Owner)
- **Logic**: Independent event management.
- **Key Features**:
  - Create, edit, and close their own events.
  - Manage own staff (Add/Remove by phone number).
  - Assign staff to specific events.
  - View real-time dashboard for own events (Revenue, Attendance).
  - View own scan logs with staff names.

### STAFF / SCANNER
- **Logic**: Operational entry management.
- **Key Features**:
  - Login with phone + OTP.
  - Access scan page for assigned events ONLY.
  - Scan and validate QR codes.
  - View personal scan history for the current session.
  - No access to financial data or other organizers' events.

### ATTENDEE (No Account)
- **Logic**: Public ticket purchasing.
- **Key Features**:
  - Browse public event pages.
  - Purchase tickets via Telebirr/CBE Birr/M-Pesa.
  - View and store their own QR tickets.

---

## 2. Implementation Roadmap

### Phase 1: Foundation & Backend (Current)
- [ ] **Database Schema Update**: Add `SuperAdmin` model and `isActive` flag to `Organizer`.
- [ ] **Auth Refactor**: Update `AuthService` to support the new role identification logic.
- [ ] **RBAC Guards**: Implement `RolesGuard` to enforce server-side boundaries.
- [ ] **Admin Module**: Create `AdminController` for platform management.

### Phase 2: Functional Enforcement
- [ ] **Organizer Boundary Checks**: Ensure organizers can only access their own data.
- [ ] **Staff Assignment Logic**: Restrict scanner access to assigned events.
- [ ] **Global Stats API**: Build the metrics engine for Super Admins.

### Phase 3: Frontend & UI
- [ ] **Navigation Refactor**: Dynamic menu items based on role.
- [ ] **Admin Dashboard**: Build the platform management interface.
- [ ] **Organizer Dashboard Updates**: Refine the reporting UI.
- [ ] **Staff Scanner Polish**: Ensure session-based scan logs are visible.

---

## 3. Route Access Matrix (Draft)

| Method | Route | Access |
| :--- | :--- | :--- |
| GET | `/api/admin/*` | Super Admin |
| POST/PATCH | `/api/admin/organizers/:id` | Super Admin |
| GET | `/api/events` | Super Admin (All), Organizer (Own) |
| POST | `/api/events` | Organizer |
| GET | `/api/events/:id/stats` | Organizer (Own), Super Admin |
| POST | `/api/tickets/validate` | Staff (Assigned), Organizer (Own) |
