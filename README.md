# CampusTutor

A peer-to-peer tutoring and skill-sharing platform for Caraga State University students, built with React + Supabase.

Covers the full workflow across four roles — **Learner**, **Tutor**, **Admin**, **OSAS** — end to end: registration with CSU-email OTP verification, tutor application with OCR-assisted document review, mandatory class-schedule confirmation before service creation, an availability calendar with a real time-overlap conflict engine, tutor discovery and a GCash/PayMongo booking-and-payment flow, sessions with reschedule/rating/incident-report actions, and the incident → OSAS case → evidence validation → decision → clearance pipeline.

## Running it

```bash
npm install
npm run dev
```

The app runs entirely on a **built-in mock backend** by default — a Zustand store persisted to `localStorage`, seeded with realistic, cross-linked sample data (see `src/lib/seed.ts`). No Supabase project is required to try every workflow.

### Demo accounts

All seeded accounts use the password `Passw0rd!` (also shown on the login page under "Need Help?"):

| Role | Email |
|---|---|
| Learner + approved Tutor | `juan@csu.edu.ph` |
| Learner | `maria.angela@csu.edu.ph` |
| Learner (application under review) | `nico.ramirez@csu.edu.ph` |
| Learner + Tutor (schedule not yet confirmed — demonstrates the Create Service lock) | `ella.marquez@csu.edu.ph` |
| Admin | `admin@csu.edu.ph` |
| OSAS | `osas@csu.edu.ph` |

### Connecting a real Supabase project

1. Run the SQL in `supabase/migrations/` against your project (schema + row-level security policies).
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Restart the dev server.

`src/lib/supabaseClient.ts` only initializes the Supabase client when both env vars are present, so the mock and live modes never mix silently.

## Architecture notes

- **Business rules are centralized** in `src/lib/constants.ts` (OCR threshold, payment allocation percentages, provider/method) — never hardcoded per-page.
- **All mutations go through `src/lib/actions/*`**, which enforce validation, conflict checks, and notifications/audit logging server-side-equivalent logic, so the UI can't bypass a rule by skipping a check.
- **The availability conflict engine** (`checkTimeConflict` in `src/lib/selectors.ts`) is the single source of truth for both availability creation and booking creation/confirmation, using real interval-overlap logic against the tutor's confirmed class schedule and existing bookings.
- **Payments** are structured behind `simulatePayMongoCheckout` / `confirmBookingPayment` so a production PayMongo Edge Function can be swapped in without touching booking logic; historical `payment_allocations` rows store the actual percentages applied at transaction time, independent of later settings changes.
- **OCR** runs client-side via Tesseract.js (`src/lib/ocr.ts`) for both class-schedule extraction and tutor-verification documents. It is always decision support — automatic approval is disabled by design (`AUTOMATIC_TUTOR_APPROVAL = false`), and confirming an OCR-extracted class schedule requires an explicit human review/correction step.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Zustand, Tesseract.js, Supabase JS client.
