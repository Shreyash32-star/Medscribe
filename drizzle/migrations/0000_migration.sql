create table public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text not null default '',
  specialty text default '',
  clinic_name text default '',
  clinic_address text default '',
  phone text default '',
  email text default '',
  city text default '',
  languages text[] not null default array['English']::text[],
  note_template text not null default 'SOAP-style documentation',
  consent_acknowledged boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  full_name text not null,
  age int,
  dob date,
  gender text,
  phone text,
  external_id text,
  blood_group text,
  allergies text,
  conditions text,
  medications text,
  created_at timestamptz not null default now()
);
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  status text not null default 'draft',
  language text default 'Mixed',
  duration_seconds int not null default 0,
  consent_confirmed boolean not null default false,
  is_demo boolean not null default false,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  idx int not null default 0,
  speaker text not null default 'Unknown',
  start_seconds int not null default 0,
  text text not null default '',
  created_at timestamptz not null default now()
);
create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  fields jsonb not null default '{}'::jsonb,
  doctor_assessment text not null default '',
  doctor_plan text not null default '',
  vitals text not null default '',
  ai_generated boolean not null default false,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.doctor_profiles, public.patients, public.consultations, public.transcript_segments, public.clinical_notes to authenticated;
grant all on public.doctor_profiles, public.patients, public.consultations, public.transcript_segments, public.clinical_notes to service_role;

alter table public.doctor_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.consultations enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.clinical_notes enable row level security;

create policy "own profile" on public.doctor_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own patients" on public.patients for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
create policy "own consultations" on public.consultations for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid() and exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
create policy "own segments" on public.transcript_segments for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid() and exists (select 1 from public.consultations c where c.id = consultation_id and c.doctor_id = auth.uid()));
create policy "own notes" on public.clinical_notes for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid() and exists (select 1 from public.consultations c where c.id = consultation_id and c.doctor_id = auth.uid()));

create index on public.patients(doctor_id);
create index on public.consultations(doctor_id, created_at desc);
create index on public.transcript_segments(consultation_id, idx);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger t1 before update on public.doctor_profiles for each row execute function public.touch_updated_at();
create trigger t2 before update on public.consultations for each row execute function public.touch_updated_at();
create trigger t3 before update on public.clinical_notes for each row execute function public.touch_updated_at();

create or replace function public.handle_new_doctor() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.doctor_profiles (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created_doctor after insert on auth.users for each row execute function public.handle_new_doctor();