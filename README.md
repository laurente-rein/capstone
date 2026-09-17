# CampusTutor

A peer-to-peer tutoring and skill-sharing platform for Caraga State University students, built with React + Supabase.

Covers the full workflow across four roles — **Learner**, **Tutor**, **Admin**, **OSAS** — end to end: registration with CSU-email OTP verification, tutor application with OCR-assisted document review, mandatory class-schedule confirmation before service creation, an availability calendar with a real time-overlap conflict engine, tutor discovery and a GCash/PayMongo booking-and-payment flow, sessions with reschedule/rating/incident-report actions, and the incident → OSAS case → evidence validation → decision → clearance pipeline.

## Running it

```bash
npm install
npm run dev
```

The app runs entirely on a **built-in mock backend** by default — a Zustand store persisted to `localStorage`, seeded with realistic, cross-linked sample data (see `src/lib/seed.ts`). No Supabase project is required to try every workflow.

### Signing in

CampusTutor is Google-sign-in-only, restricted to `@csu.edu.ph` institutional accounts:

1. **Continue with Google** opens a simulated Google account chooser (this demo environment has no real OAuth client ID, so it lists mock CSU Google accounts instead of hitting Google's actual consent screen).
2. Pick an account — or **Use another account** to type any name + `@csu.edu.ph` email. A non-CSU email (e.g. `@gmail.com`) is rejected right there, matching the real "only institutional accounts" restriction.
3. An OTP is sent to that email (shown in the dev console) and must be verified.
4. **Existing account** → straight to the dashboard. **Brand-new email** → a short "Complete your profile" step (Student ID, college, program, year level — the things Google itself doesn't know) before landing on the Learner Dashboard.

Every account is a single, unified identity — there is no separate "tutor account". A student is a Learner by default; once Admin approves their tutor application, that *same* account gains Tutor capability (shown as a Learner | Tutor switcher in the sidebar).

### Demo accounts

These are the accounts listed in the account chooser:

| Role | Email |
|---|---|
| Learner / Tutor — already has an established marketplace (services, bookings, ratings) to browse | `juan@csu.edu.ph` |
| Learner — use this one to try the tutor pipeline from scratch | `maria.angela@csu.edu.ph` |
| Admin | `admin@csu.edu.ph` |
| OSAS | `osas@csu.edu.ph` |

You can also just type a brand-new `@csu.edu.ph` email under "Use another account" to try the first-time-signup + profile-completion path.

To see the full apply-as-tutor journey end to end on one account, either register a brand new account or log in as a plain Learner (e.g. `maria.angela@csu.edu.ph`) and:

1. Click the **Tutor** toggle in the sidebar (or **Apply as Tutor**) — since you haven't applied yet, it opens the application form.
2. Submit it. It now shows an "Under Review" status screen if you click **Tutor** again.
3. Log in as `admin@csu.edu.ph` → **Tutor Verification** → approve the application.
4. Log back in as your account — the **Tutor** toggle now opens the Tutor dashboard directly. **My Services → Create Service** is locked with a "Class Schedule Required" prompt.
5. Go to **Availability & Schedule → Class Schedule**, upload an image (any image works — OCR runs for real, but you can also just add rows manually in the review step), then confirm it.
6. **Create Service** is now unlocked.

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
