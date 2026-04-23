# Secure Iqub — Community-Powered Rotating Savings Platform

A production-style MVP built with the MEAN stack (MongoDB · Express.js · Angular · Node.js).

---

## Slot-Based Payout Model (Critical Business Logic)

This is the most important section. Read it carefully.

### Core Rule

```
1 full iqub slot = $2,000/month contribution

A cycle has exactly 12 full slots.

Monthly pool  = 12 slots × $2,000 = $24,000
Slot payout   = 12 months × $2,000 = $24,000

Total paid in  = 12 months × $24,000/month = $288,000
Total paid out = 12 slots  × $24,000/slot  = $288,000
```

**The math is perfectly balanced. There is no shortfall.**

### Slot Ownership

A full slot can be owned:

**1. Single-owner** — One person contributes the full $2,000/month. They own 100% and receive the full $24,000 if their slot wins.

**2. Shared** — Two or more people combine contributions to reach $2,000/month:

| Member | Monthly | Share | Payout if slot wins |
|--------|---------|-------|---------------------|
| Member A | $500 | 25% | $6,000 |
| Member B | $1,500 | 75% | $18,000 |
| **Total** | **$2,000** | **100%** | **$24,000** |

The system enforces: `sum(all member contributions in a slot) === $2,000`

### Seed Data Demonstration

The seed creates 12 slots:
- Slots 1–10: single owner, $2,000 each
- Slot 11: shared — Kalid $1,000 + Saba $1,000 (50/50)
- Slot 12: shared — Nati $500 + Liya $1,500 (25/75)

### Spin Eligibility Rule

A slot is eligible to spin if:
1. Its status is `eligible` (has not yet won)
2. All member payments for the current month are `approved` AND sum ≥ $2,000

---

## Project Structure

```
secure-iqub/
├── backend/
│   ├── src/
│   │   ├── config/           # DB, constants
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Group.js
│   │   │   ├── Slot.js
│   │   │   ├── SlotMemberContribution.js
│   │   │   ├── MonthlyCycle.js
│   │   │   ├── Payment.js
│   │   │   ├── SpinResult.js
│   │   │   ├── PayoutDistribution.js
│   │   │   ├── PlatformSetting.js
│   │   │   ├── AuditLog.js
│   │   │   └── Notification.js
│   │   ├── middleware/        # auth, roleGuard, errorHandler, validate, auditLogger
│   │   ├── routes/            # auth, admin, super-admin, member
│   │   ├── controllers/       # auth, admin, superadmin, member
│   │   ├── services/          # auth, group, payment, spin, analytics
│   │   ├── validators/        # Joi schemas
│   │   └── utils/             # response, dateUtils, logger
│   ├── seeds/seed.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    └── src/app/
        ├── core/              # guards, interceptors, services, models
        ├── shared/            # reusable components (StatCard, StatusBadge, etc.)
        ├── features/
        │   ├── auth/          # Login, ForgotPassword, ResetPassword
        │   ├── admin/         # Dashboard, Groups, Slots, Payments, LuckySpin
        │   ├── super-admin/   # Dashboard, Admins, Groups, Settings, AuditLogs
        │   └── member/        # Dashboard, Payments, Slot, WinnerHistory
        └── app-routing.module.ts
```

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB ≥ 6
- Angular CLI ≥ 17 (`npm install -g @angular/cli`)

### Backend

```bash
cd secure-iqub/backend
npm install

# Copy and configure environment variables
cp .env
# Edit .env: set MONGO_URI, JWT_SECRET, etc.

# Seed demo data
npm run seed

# Start development server
npm run dev
# → API running on http://localhost:5000
```

### Frontend

```bash
cd secure-iqub/frontend
npm install

# Start Angular dev server
ng serve
# → App running on http://localhost:4200
```

---

## Demo Credentials (after running seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@secureiqub.com | SuperAdmin@123 |
| Admin | admin@secureiqub.com | Admin@1234 |
| Member | abebe@demo.com | Member@1234 |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| POST | /api/auth/forgot-password | Request reset link |
| POST | /api/auth/reset-password | Reset password |
| POST | /api/auth/accept-invite | Accept member invite |
| GET | /api/auth/profile | Get current user |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/groups | Create group |
| GET | /api/admin/groups | List my groups |
| GET | /api/admin/groups/:id | Group details + slots |
| PUT | /api/admin/groups/:id | Update group |
| POST | /api/admin/groups/:id/activate | Activate cycle |
| POST | /api/admin/groups/:id/slots | Create slot |
| POST | /api/admin/groups/:id/slots/:sid/members | Assign member to slot |
| DELETE | /api/admin/groups/:id/slots/:sid/members/:mid | Remove member |
| POST | /api/admin/groups/:id/payments | Submit payment |
| PATCH | /api/admin/payments/:id/approve | Approve payment |
| PATCH | /api/admin/payments/:id/reject | Reject payment |
| POST | /api/admin/groups/:id/spin | Run monthly spin |
| GET | /api/admin/groups/:id/spin-history | Spin history |
| GET | /api/admin/groups/:id/eligible-slots | Eligible slots for spin |
| GET | /api/admin/groups/:id/analytics | Group analytics |

### Super Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/super-admin/analytics | Platform analytics |
| POST | /api/super-admin/admins | Create admin |
| GET | /api/super-admin/admins | List admins |
| PATCH | /api/super-admin/admins/:id/toggle-status | Suspend/activate admin |
| GET | /api/super-admin/groups | All groups |
| PATCH | /api/super-admin/groups/:id/suspend | Suspend group |
| GET | /api/super-admin/settings | Platform settings |
| PUT | /api/super-admin/settings | Update settings |
| GET | /api/super-admin/audit-logs | Audit log (paginated) |

### Member
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/member/dashboard | My dashboard |
| GET | /api/member/payments | My payment history |
| GET | /api/member/slot | My slot details |
| GET | /api/member/penalties | My penalties |
| GET | /api/member/payout-status | My payout records |
| GET | /api/member/groups/:id/winner-history | Group winner history |
| GET | /api/member/notifications | My notifications |

---

## Payment Timeliness Rules

| Day Paid | Status | Color |
|----------|--------|-------|
| Day 1 | On Time | ✅ Green |
| Day 2 | Yellow Warning | ⚠️ Yellow |
| Day 3 | Strong Warning | 🟠 Orange |
| After due date | Late | 🔴 Red |

Late penalty: **$20 per calendar day** (configurable by Super Admin)

---

## Spin Algorithm

1. Collect all slots with status = `eligible`
2. Filter to those where all member payments for the month are `approved` and sum ≥ $2,000
3. Generate a UUID as entropy seed (stored for audit)
4. Select winning index: `parseInt(uuid.replace(/-/g,'').slice(0,8), 16) % eligibleCount`
5. Mark winning slot as `won`, save SpinResult + PayoutDistribution
6. Advance group to next month

The UUID seed is stored in the SpinResult record for full auditability.

---

## Key Validation Rules (Enforced Server-Side)

- A cycle cannot activate unless exactly 12 slots exist
- Every slot must have `assignedMonthlyAmount === $2,000`
- A member can only belong to one slot per cycle (unless `allowMultiSlotMembership` override)
- A month cannot be spun twice (`SpinResult` has unique index on `{group, monthNumber}`)
- Spin cannot run before collection conditions are met
- Slots are locked after cycle activation
- Every critical action writes an immutable AuditLog record

---

## Phase 2 Suggestions

- [ ] Payment gateway integration (Stripe, Chapa, Paystack)
- [ ] Email/SMS reminders for due dates
- [ ] Digital receipt generation (PDF)
- [ ] Live spin session via Zoom/Teams embed
- [ ] Downloadable PDF reports (jsPDF/PDFKit)
- [ ] Multilingual support (Amharic, Tigrinya, English)
- [ ] Multi-tenant support (one platform, many businesses)
- [ ] Anomaly detection (unusual payment patterns, fraud flags)
- [ ] Mobile app (Ionic/Capacitor wrapping the Angular frontend)
- [ ] Advanced analytics dashboard with Chart.js visualizations

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payout model | Slot-based | Eliminates any ambiguity about shortfall |
| Spin randomness | UUID modulo | Auditable; UUID stored in SpinResult |
| Role guard | Server-side + client-side | Defense in depth |
| Audit log | Immutable append-only | Financial trust |
| Payment timeliness | Day-of-month comparison | Business-specified rules |
| Slot validation | Pre-activation check | Fail fast before money moves |
| Payout split | Proportional (default) or custom | Flexible but always audited |
| Admin request flow | Separate entity → approved → User | Prevents accidental admin creation |
| Slot leader | Representative only, not financial owner | Separates display from payout logic |
| Email service | nodemailer + console fallback | Works without SMTP in dev mode |

---

## Admin Request / Leader Application Workflow

```
Landing Page → "Become an Iqub Leader" button
  └─> POST /api/public/leader-applications
        └─> AdminRequest created (status: new)
              └─> Super Admin reviews
                    ├─> Mark contacted → (status: contacted)
                    ├─> Approve → POST /api/super-admin/admin-requests/:id/approve
                    │     └─> User account created (role: admin, firstLogin: true)
                    │     └─> Welcome email sent
                    │     └─> AdminRequest.status = converted
                    └─> Reject → (status: rejected)
```

**Key rules:**
- An AdminRequest is NOT an admin account — it is only an application
- Only Super Admin can approve and create admin accounts
- Duplicate pending applications from the same email are blocked
- A converted request cannot be approved again
- Temporary password is shown once in the approval response and sent by email

---

## Shared Slot Leader System

A **leader** is a designated representative for a shared slot group.

```
Shared slot example:
  Leader = Kalid Ibrahim ($1,000/month = 50%)
  Member = Saba Tesfay  ($1,000/month = 50%)
  Total  = $2,000/month ✓

Lucky Spin display:
  Wheel shows: ⭐ Kalid Ibrahim  (instead of "Slot 11 — Kalid & Saba")

If this slot wins:
  Total payout = $24,000
  Kalid gets   = 12 × $1,000 = $12,000  (50%)
  Saba gets    = 12 × $1,000 = $12,000  (50%)
```

**Why leader is only a display label:**
- Avoids confusion: the spin result shows one clear name rather than a list of members
- Payout is still mathematically split by contribution — no money goes to the leader exclusively
- The leader is set by the Admin, not chosen by the members
- Any member in the slot can be designated as the leader

---

## Payout Formula (Per Member)

```
Monthly contribution × Cycle length = Projected payout

$250/month  → 12 × $250  = $3,000
$500/month  → 12 × $500  = $6,000
$1,000/month → 12 × $1,000 = $12,000
$1,500/month → 12 × $1,500 = $18,000
$2,000/month → 12 × $2,000 = $24,000 (full slot)
```

---

## Email System

Configure SMTP in `.env` to enable real email sending:

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=yourpassword
EMAIL_FROM="Secure Iqub <no-reply@secureiqub.com>"
```

If `EMAIL_HOST` is not set, the email service falls back to **console logging** — the app works normally without a mail server (useful for development).

**Email templates:**
- `WELCOME_ADMIN` — Sent when Super Admin approves a leader application and creates an admin account
- `APPLICATION_RECEIVED` — Sent to the applicant immediately after they submit a leader application

---

## New API Endpoints (v2)

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/public/leader-applications | Submit leader/admin application |

### Super Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/super-admin/admins | List admins with member/group counts |
| GET | /api/super-admin/admins/:id | Admin detail + stats + groups |
| GET | /api/super-admin/admin-requests | List leader applications |
| GET | /api/super-admin/admin-requests/counts | Request status counts |
| GET | /api/super-admin/admin-requests/:id | Single application detail |
| PATCH | /api/super-admin/admin-requests/:id/status | Update status / add notes |
| POST | /api/super-admin/admin-requests/:id/approve | Approve → create admin account |
| POST | /api/super-admin/admin-requests/:id/reject | Reject application |
| POST | /api/super-admin/admin-requests/:id/send-welcome-email | Resend welcome email |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | /api/admin/groups/:id/slots/:slotId/leader | Set slot leader |
| GET | /api/admin/groups/:id/slots/:slotId/payout-preview | Slot payout breakdown |
| GET | /api/admin/dashboard/summary | Dashboard summary + firstLogin flag |
| POST | /api/admin/dashboard/dismiss-welcome | Dismiss onboarding welcome card |
