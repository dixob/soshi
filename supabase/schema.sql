-- Soshi CRM — Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Profiles (linked to Supabase Auth)
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  org_id uuid references organizations(id) on delete cascade not null,
  full_name text not null default '',
  role text not null default 'owner',
  digest_time text not null default '08:00',
  timezone text not null default 'America/New_York',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Contacts (shared across preneed + aftercare)
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  first_name text not null,
  last_name text not null default '',
  phone text,
  email text,
  address text,
  relationship_notes text,
  communication_pref text default 'phone',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Preneed Prospects (pipeline cards)
create table preneed_prospects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete cascade not null,
  stage text not null default 'prospect'
    check (stage in ('prospect','contacted','interested','quoted','follow_up','converted')),
  disposition_pref text not null default 'undecided'
    check (disposition_pref in ('burial','cremation','undecided')),
  estimated_budget text,
  lead_source text not null default 'other'
    check (lead_source in ('referral','community_event','walk_in','website','social_media','cold_outreach','aftercare_conversion','other')),
  next_followup_date date,
  followup_note text,
  last_contact_date date,
  converted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log (append-only)
-- BUG-014: Added org_id to avoid nested subquery in RLS
create table activities (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  prospect_id uuid references preneed_prospects(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  activity_type text not null default 'note'
    check (activity_type in ('call','email','meeting','note','stage_change','created')),
  note text not null default '',
  created_at timestamptz default now()
);

-- Aftercare Cases
create table aftercare_cases (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete cascade not null,
  deceased_name text not null,
  service_date date not null,
  status text not null default 'active'
    check (status in ('active','completed','converted')),
  created_at timestamptz default now()
);

-- Aftercare Touchpoints
-- BUG-015: Added org_id to avoid nested subquery in RLS
create table aftercare_touchpoints (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  case_id uuid references aftercare_cases(id) on delete cascade not null,
  touchpoint_type text not null default 'phone_call'
    check (touchpoint_type in ('phone_call','email','card','task')),
  label text not null,
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending','completed','skipped','rescheduled')),
  completed_at timestamptz,
  note text,
  skip_reason text,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index idx_contacts_org on contacts(org_id);
create index idx_prospects_org on preneed_prospects(org_id);
create index idx_prospects_stage on preneed_prospects(org_id, stage);
create index idx_prospects_followup on preneed_prospects(next_followup_date) where next_followup_date is not null;
create index idx_activities_org on activities(org_id);
create index idx_activities_prospect on activities(prospect_id);
create index idx_activities_contact on activities(contact_id);
create index idx_aftercare_org on aftercare_cases(org_id);
create index idx_touchpoints_org on aftercare_touchpoints(org_id);
create index idx_touchpoints_case on aftercare_touchpoints(case_id);
create index idx_touchpoints_due on aftercare_touchpoints(due_date, status) where status = 'pending';

-- Row Level Security
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table preneed_prospects enable row level security;
alter table activities enable row level security;
alter table aftercare_cases enable row level security;
alter table aftercare_touchpoints enable row level security;

-- RLS Policies: users can only access data from their own org
-- BUG-017: Split org policy — all members can SELECT, only owners can UPDATE/DELETE
create policy "Users see own org" on organizations
  for select using (id in (select org_id from profiles where user_id = auth.uid()));

create policy "Users insert org" on organizations
  for insert with check (true);

create policy "Owners update own org" on organizations
  for update using (id in (select org_id from profiles where user_id = auth.uid() and role = 'owner'));

create policy "Owners delete own org" on organizations
  for delete using (id in (select org_id from profiles where user_id = auth.uid() and role = 'owner'));

-- BUG-016: Split profile policy — org members can SELECT each other, but only edit own row
create policy "Users see org profiles" on profiles
  for select using (org_id in (select org_id from profiles where user_id = auth.uid()));

create policy "Users insert own profile" on profiles
  for insert with check (user_id = auth.uid());

create policy "Users update own profile" on profiles
  for update using (user_id = auth.uid());

create policy "Users delete own profile" on profiles
  for delete using (user_id = auth.uid());

create policy "Users access org contacts" on contacts
  for all using (org_id in (select org_id from profiles where user_id = auth.uid()));

create policy "Users access org prospects" on preneed_prospects
  for all using (org_id in (select org_id from profiles where user_id = auth.uid()));

-- BUG-014: Simplified — direct org_id check instead of nested subquery through contacts
create policy "Users access org activities" on activities
  for all using (org_id in (select org_id from profiles where user_id = auth.uid()));

create policy "Users access org aftercare" on aftercare_cases
  for all using (org_id in (select org_id from profiles where user_id = auth.uid()));

-- BUG-015: Simplified — direct org_id check instead of nested subquery through aftercare_cases
create policy "Users access org touchpoints" on aftercare_touchpoints
  for all using (org_id in (select org_id from profiles where user_id = auth.uid()));

-- Auto-create profile + org on signup
-- IMPORTANT: `set search_path = public` is required on all security definer functions.
-- Without it, Postgres uses pg_catalog as the default search path when running as the
-- function owner (a superuser), which means it can't find tables in the public schema.
-- Symptom: "Database error saving new user" → auth user creation rolled back → magic
-- link code exchange fails → user redirected back to login and hits email rate limit.
create or replace function handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name) values ('My Funeral Home') returning id into new_org_id;
  insert into profiles (user_id, org_id, full_name)
  values (new.id, new_org_id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at before update on contacts
  for each row execute procedure update_updated_at();
create trigger prospects_updated_at before update on preneed_prospects
  for each row execute procedure update_updated_at();
