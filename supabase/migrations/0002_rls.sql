-- Row Level Security — backend enforcement (never rely on frontend checks alone).
-- Assumes users.auth_user_id = auth.uid() links a Supabase Auth user to their app row.

create or replace function current_app_user_id() returns uuid
language sql stable as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function has_role(target_role app_role) returns boolean
language sql stable as $$
  select exists (
    select 1 from user_roles
    where user_id = current_app_user_id() and role = target_role
  )
$$;

alter table users enable row level security;
alter table user_roles enable row level security;
alter table tutor_applications enable row level security;
alter table verification_documents enable row level security;
alter table class_schedules enable row level security;
alter table class_schedule_entries enable row level security;
alter table services enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table payment_allocations enable row level security;
alter table ratings enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table incident_reports enable row level security;
alter table cases enable row level security;
alter table evidence_validations enable row level security;
alter table case_actions enable row level security;
alter table case_decisions enable row level security;
alter table clearance_reviews enable row level security;
alter table audit_logs enable row level security;
alter table system_settings enable row level security;

-- Users can read/update their own profile; Admin can read/update any.
create policy users_self_select on users for select using (id = current_app_user_id() or has_role('admin') or has_role('osas'));
create policy users_self_update on users for update using (id = current_app_user_id() or has_role('admin'));

-- Tutor applications: owner + admin.
create policy tutor_app_owner on tutor_applications for select using (user_id = current_app_user_id() or has_role('admin'));
create policy tutor_app_insert on tutor_applications for insert with check (user_id = current_app_user_id());
create policy tutor_app_admin_update on tutor_applications for update using (has_role('admin'));

-- Class schedules: owner tutor + admin. Confirmed schedules are read-only to the tutor
-- (application layer blocks edits; DB layer additionally blocks once status = CONFIRMED).
create policy class_schedule_owner on class_schedules for select using (tutor_id = current_app_user_id() or has_role('admin'));
create policy class_schedule_owner_write on class_schedules for insert with check (tutor_id = current_app_user_id());
create policy class_schedule_owner_update on class_schedules for update using (tutor_id = current_app_user_id() and status = 'DRAFT');

-- Services: public read of ACTIVE rows; owner + admin manage.
create policy services_public_read on services for select using (status = 'ACTIVE' or tutor_id = current_app_user_id() or has_role('admin'));
create policy services_owner_write on services for insert with check (
  tutor_id = current_app_user_id()
  and exists (select 1 from class_schedules where tutor_id = current_app_user_id() and status = 'CONFIRMED')
);
create policy services_owner_update on services for update using (tutor_id = current_app_user_id() or has_role('admin'));

-- Availability: public read of active slots; owner manages own.
create policy availability_read on availability_slots for select using (true);
create policy availability_owner_write on availability_slots for insert with check (tutor_id = current_app_user_id());
create policy availability_owner_delete on availability_slots for delete using (tutor_id = current_app_user_id());

-- Bookings: visible to the learner, the tutor, and admin only.
create policy bookings_participant on bookings for select using (
  learner_id = current_app_user_id() or tutor_id = current_app_user_id() or has_role('admin')
);
create policy bookings_learner_insert on bookings for insert with check (learner_id = current_app_user_id());
create policy bookings_participant_update on bookings for update using (
  learner_id = current_app_user_id() or tutor_id = current_app_user_id() or has_role('admin')
);

-- Payments: participants of the underlying booking + admin.
create policy payments_participant on payments for select using (
  has_role('admin') or exists (
    select 1 from bookings b where b.id = payments.booking_id
      and (b.learner_id = current_app_user_id() or b.tutor_id = current_app_user_id())
  )
);

-- Notifications: strictly owner-only.
create policy notifications_owner on notifications for select using (user_id = current_app_user_id());
create policy notifications_owner_update on notifications for update using (user_id = current_app_user_id());

-- Messages: only conversation participants.
create policy messages_participant on messages for select using (
  exists (select 1 from conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = current_app_user_id())
);
create policy messages_participant_insert on messages for insert with check (
  sender_id = current_app_user_id() and exists (
    select 1 from conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = current_app_user_id()
  )
);

-- Incidents: reporter, reported user (read-only awareness not required, restrict to reporter), and admin.
create policy incidents_reporter on incident_reports for select using (reporter_id = current_app_user_id() or has_role('admin') or has_role('osas'));
create policy incidents_insert on incident_reports for insert with check (reporter_id = current_app_user_id());
create policy incidents_admin_update on incident_reports for update using (has_role('admin'));

-- OSAS cases: OSAS + admin only. Never exposed to learner/tutor directly.
create policy cases_osas on cases for select using (has_role('osas') or has_role('admin'));
create policy cases_osas_write on cases for update using (has_role('osas'));
create policy evidence_validations_osas on evidence_validations for select using (has_role('osas') or has_role('admin'));
create policy evidence_validations_osas_insert on evidence_validations for insert with check (has_role('osas'));
create policy case_actions_osas on case_actions for select using (has_role('osas') or has_role('admin'));
create policy case_actions_osas_insert on case_actions for insert with check (has_role('osas'));
create policy case_decisions_osas on case_decisions for select using (has_role('osas') or has_role('admin'));
create policy case_decisions_osas_insert on case_decisions for insert with check (has_role('osas'));

-- Clearance reviews: OSAS/Admin manage; the student may read only their own.
create policy clearance_osas_read on clearance_reviews for select using (
  user_id = current_app_user_id() or has_role('osas') or has_role('admin')
);
create policy clearance_osas_write on clearance_reviews for all using (has_role('osas')) with check (has_role('osas'));

-- Audit logs: admin read-only. No insert/update/delete policy for regular roles —
-- writes happen exclusively through a SECURITY DEFINER function called by trusted actions.
create policy audit_logs_admin_read on audit_logs for select using (has_role('admin'));

-- System settings: readable by admin; writable by admin only.
create policy settings_admin on system_settings for select using (has_role('admin'));
create policy settings_admin_write on system_settings for update using (has_role('admin'));
