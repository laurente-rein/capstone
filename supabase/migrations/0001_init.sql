-- CampusTutor — full schema
-- Roles are stored per-user in user_roles (a student is LEARNER by default; an approved
-- tutor gets an additional TUTOR row on the SAME account — never a second account).

create extension if not exists "pgcrypto";

create type app_role as enum ('learner', 'tutor', 'admin', 'osas');
create type user_status as enum ('active', 'suspended');
create type application_status as enum ('PENDING', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED', 'APPROVED', 'REJECTED');
create type schedule_status as enum ('DRAFT', 'CONFIRMED');
create type session_type as enum ('ONLINE', 'IN_PERSON', 'BOTH');
create type booking_session_type as enum ('ONLINE', 'IN_PERSON');
create type service_status as enum ('ACTIVE', 'SUSPENDED', 'DRAFT');
create type booking_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
create type payment_status as enum ('UNPAID', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');
create type reschedule_status as enum ('PENDING', 'ACCEPTED', 'DECLINED');
create type refund_status as enum ('REQUESTED', 'APPROVED', 'DENIED', 'COMPLETED');
create type incident_status as enum ('SUBMITTED', 'UNDER_ADMIN_REVIEW', 'RESOLVED_PLATFORM', 'REFERRED_TO_OSAS');
create type case_status as enum ('OPEN', 'EVIDENCE_REVIEW', 'DECIDED', 'ARCHIVED');
create type evidence_result as enum ('VALIDATED', 'INSUFFICIENT', 'REQUIRES_CLARIFICATION');
create type clearance_status as enum ('PENDING_REVIEW', 'CLEARED', 'ON_HOLD', 'REQUIRES_RESOLUTION');

-- ---------------- Users ----------------

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique, -- references auth.users(id) in Supabase Auth
  first_name text not null,
  last_name text not null,
  student_id text,
  email text not null unique,
  college text,
  program text,
  year_level text,
  status user_status not null default 'active',
  suspension_reason text,
  avatar_url text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_users_email on users (email);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  role app_role not null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------------- Tutor application & verification ----------------

create table tutor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  status application_status not null default 'PENDING',
  subjects text[] not null default '{}',
  motivation text,
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references users (id)
);
create index idx_tutor_applications_user on tutor_applications (user_id);

create table verification_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references tutor_applications (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  ocr_extracted_text text,
  ocr_fields jsonb,
  ocr_confidence numeric(5,2),
  uploaded_at timestamptz not null default now()
);

create table tutor_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  bio text,
  average_rating numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  total_earnings numeric(12,2) not null default 0
);

-- ---------------- Class schedule (belongs to the tutor account, not a service) ----------------

create table class_schedules (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references users (id) on delete cascade,
  status schedule_status not null default 'DRAFT',
  source_file_name text,
  ocr_confidence numeric(5,2),
  uploaded_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index idx_class_schedules_tutor on class_schedules (tutor_id, status);

create table class_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references class_schedules (id) on delete cascade,
  course_code text not null,
  course_name text,
  day text not null check (day in ('MON','TUE','WED','THU','FRI','SAT','SUN')),
  start_time time not null,
  end_time time not null,
  room text,
  check (start_time < end_time)
);
create index idx_class_schedule_entries_schedule on class_schedule_entries (schedule_id);

-- ---------------- Services ----------------

create table services (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references users (id) on delete cascade,
  title text not null,
  subject text not null,
  category text,
  level text,
  description text,
  hourly_rate numeric(10,2) not null check (hourly_rate > 0),
  session_type session_type not null default 'BOTH',
  status service_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);
create index idx_services_tutor on services (tutor_id);
create index idx_services_status on services (status);

create table service_topics (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  topic text not null
);

-- ---------------- Availability (actual dates/times, not just weekday labels) ----------------

create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references users (id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index idx_availability_tutor_date on availability_slots (tutor_id, slot_date);

-- ---------------- Bookings ----------------

create table bookings (
  id text primary key, -- human-readable booking code, e.g. CTB-2026-0001
  learner_id uuid not null references users (id),
  tutor_id uuid not null references users (id),
  service_id uuid not null references services (id),
  specific_topic text,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  session_type booking_session_type not null,
  location text,
  meeting_platform text,
  meeting_url text,
  amount numeric(10,2) not null,
  booking_status booking_status not null default 'PENDING',
  payment_status payment_status not null default 'UNPAID',
  cancelled_by uuid references users (id),
  cancel_reason text,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index idx_bookings_learner on bookings (learner_id);
create index idx_bookings_tutor on bookings (tutor_id, session_date);

create table reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references bookings (id) on delete cascade,
  requested_by uuid not null references users (id),
  new_date date not null,
  new_start_time time not null,
  new_end_time time not null,
  reason text,
  status reschedule_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

-- ---------------- Payments (PayMongo / GCash only) ----------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references bookings (id) on delete cascade,
  provider text not null default 'PayMongo',
  method text not null default 'GCash',
  provider_reference_id text not null,
  gross_amount numeric(10,2) not null,
  status payment_status not null,
  created_at timestamptz not null default now()
);
create unique index idx_payments_booking on payments (booking_id);

-- Historical allocations store the ACTUAL percentages applied at transaction time,
-- so later changes to system_settings never retroactively rewrite past records.
create table payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id) on delete cascade,
  tutor_share numeric(10,2) not null,
  osas_share numeric(10,2) not null,
  platform_share numeric(10,2) not null,
  tutor_share_pct numeric(5,4) not null,
  osas_share_pct numeric(5,4) not null,
  platform_share_pct numeric(5,4) not null,
  check (tutor_share_pct + osas_share_pct + platform_share_pct = 1)
);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id) on delete cascade,
  amount numeric(10,2) not null,
  reason text not null,
  status refund_status not null default 'REQUESTED',
  created_at timestamptz not null default now()
);

-- ---------------- Ratings ----------------

create table ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null unique references bookings (id) on delete cascade,
  learner_id uuid not null references users (id),
  tutor_id uuid not null references users (id),
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------- Messaging ----------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  context_booking_id text references bookings (id),
  context_service_id uuid references services (id),
  last_message_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references users (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index idx_messages_conversation on messages (conversation_id, created_at);

create table message_reads (
  message_id uuid not null references messages (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- ---------------- Notifications ----------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  body text,
  type text not null,
  link_to text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications (user_id, read);

-- ---------------- Incidents & OSAS cases ----------------

create table incident_reports (
  id text primary key, -- e.g. INC-2026-0001
  booking_id text references bookings (id),
  reporter_id uuid not null references users (id),
  reported_user_id uuid not null references users (id),
  incident_type text not null,
  description text not null,
  status incident_status not null default 'SUBMITTED',
  admin_notes text,
  created_at timestamptz not null default now()
);

create table incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id text not null references incident_reports (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table cases (
  id text primary key, -- e.g. CASE-2026-0001
  incident_report_id text not null references incident_reports (id),
  booking_id text references bookings (id),
  reporter_id uuid not null references users (id),
  reported_user_id uuid not null references users (id),
  incident_type text not null,
  priority text not null default 'MEDIUM',
  status case_status not null default 'OPEN',
  assigned_to uuid references users (id),
  description text,
  notes text,
  opened_at timestamptz not null default now()
);

create table case_timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references cases (id) on delete cascade,
  label text not null,
  at timestamptz not null default now()
);

create table evidence_validations (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references cases (id) on delete cascade,
  evidence_id uuid not null references incident_evidence (id),
  readability boolean not null,
  context_completeness boolean not null,
  relevance boolean not null,
  source_verification boolean not null,
  signs_of_manipulation boolean not null,
  result evidence_result not null,
  notes text,
  validated_by uuid not null references users (id),
  validated_at timestamptz not null default now()
);

create table case_actions (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references cases (id) on delete cascade,
  action text not null,
  notes text,
  acted_by uuid not null references users (id),
  created_at timestamptz not null default now()
);

create table case_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id text not null unique references cases (id) on delete cascade,
  decision text not null,
  details text,
  clearance_effect text,
  decided_by uuid not null references users (id),
  decided_at timestamptz not null default now()
);

create table clearance_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  status clearance_status not null default 'PENDING_REVIEW',
  reason text,
  updated_at timestamptz not null default now()
);
create unique index idx_clearance_reviews_user on clearance_reviews (user_id);

create table clearance_holds (
  id uuid primary key default gen_random_uuid(),
  clearance_review_id uuid not null references clearance_reviews (id) on delete cascade,
  case_id text not null references cases (id),
  created_at timestamptz not null default now()
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  body text not null,
  updated_at timestamptz not null default now()
);

-- ---------------- Audit & settings ----------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users (id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details text,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_created on audit_logs (created_at desc);
-- Audit logs are append-only: no update/delete grants issued to application roles.

create table system_settings (
  id boolean primary key default true, -- singleton row
  ocr_confidence_threshold numeric(5,2) not null default 80,
  automatic_tutor_approval boolean not null default false,
  payment_provider text not null default 'PayMongo',
  payment_method text not null default 'GCash',
  tutor_share_pct numeric(5,4) not null default 0.90,
  osas_share_pct numeric(5,4) not null default 0.05,
  platform_share_pct numeric(5,4) not null default 0.05,
  check (id),
  check (tutor_share_pct + osas_share_pct + platform_share_pct = 1)
);
insert into system_settings (id) values (true);
