create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  display_name text,
  onboarding_completed boolean not null default false,
  is_premium boolean not null default false,
  avatar_recipe_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_premium boolean not null default false;

create table if not exists public.avatar_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body_type text not null,
  skin_tone text not null,
  hair_style text not null,
  hair_color text not null,
  accessory text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avatar_recipes_user_unique unique (user_id)
);

alter table public.profiles
  drop constraint if exists profiles_avatar_recipe_id_fkey;

alter table public.profiles
  add constraint profiles_avatar_recipe_id_fkey
  foreign key (avatar_recipe_id) references public.avatar_recipes(id) on delete set null;

create table if not exists public.avatar_assets (
  signature text primary key,
  storage_path text not null,
  public_url text,
  recipe_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poster_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  check_in_id text not null,
  theme text not null,
  streak_days integer not null default 1,
  avatar_asset_signature text references public.avatar_assets(signature) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  unit text not null,
  target_value numeric,
  reminder_enabled boolean not null default false,
  reminder_hour integer not null default 21,
  reminder_minute integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null references public.habits(id) on delete cascade,
  check_date timestamptz not null,
  value numeric,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_code text not null,
  habit_id text references public.habits(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  share_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint user_badges_user_code_unique unique (user_id, badge_code)
);

create table if not exists public.paywall_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists avatar_recipes_touch_updated_at on public.avatar_recipes;
create trigger avatar_recipes_touch_updated_at
before update on public.avatar_recipes
for each row execute function public.touch_updated_at();

drop trigger if exists habits_touch_updated_at on public.habits;
create trigger habits_touch_updated_at
before update on public.habits
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.avatar_recipes enable row level security;
alter table public.avatar_assets enable row level security;
alter table public.poster_events enable row level security;
alter table public.habits enable row level security;
alter table public.check_ins enable row level security;
alter table public.user_badges enable row level security;
alter table public.paywall_events enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "avatar recipes own select" on public.avatar_recipes;
create policy "avatar recipes own select" on public.avatar_recipes
for select using (auth.uid() = user_id);

drop policy if exists "avatar recipes own insert" on public.avatar_recipes;
create policy "avatar recipes own insert" on public.avatar_recipes
for insert with check (auth.uid() = user_id);

drop policy if exists "avatar recipes own update" on public.avatar_recipes;
create policy "avatar recipes own update" on public.avatar_recipes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "avatar assets public read" on public.avatar_assets;
create policy "avatar assets public read" on public.avatar_assets
for select using (true);

drop policy if exists "avatar assets authenticated insert" on public.avatar_assets;
create policy "avatar assets authenticated insert" on public.avatar_assets
for insert with check (auth.role() = 'authenticated');

drop policy if exists "avatar assets authenticated update" on public.avatar_assets;
create policy "avatar assets authenticated update" on public.avatar_assets
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "poster events own select" on public.poster_events;
create policy "poster events own select" on public.poster_events
for select using (auth.uid() = user_id);

drop policy if exists "poster events own insert" on public.poster_events;
create policy "poster events own insert" on public.poster_events
for insert with check (auth.uid() = user_id);

drop policy if exists "poster events own update" on public.poster_events;
create policy "poster events own update" on public.poster_events
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "poster events own delete" on public.poster_events;
create policy "poster events own delete" on public.poster_events
for delete using (auth.uid() = user_id);

drop policy if exists "habits own select" on public.habits;
create policy "habits own select" on public.habits
for select using (auth.uid() = user_id);

drop policy if exists "habits own insert" on public.habits;
create policy "habits own insert" on public.habits
for insert with check (auth.uid() = user_id);

drop policy if exists "habits own update" on public.habits;
create policy "habits own update" on public.habits
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habits own delete" on public.habits;
create policy "habits own delete" on public.habits
for delete using (auth.uid() = user_id);

drop policy if exists "check ins own select" on public.check_ins;
create policy "check ins own select" on public.check_ins
for select using (auth.uid() = user_id);

drop policy if exists "check ins own insert" on public.check_ins;
create policy "check ins own insert" on public.check_ins
for insert with check (auth.uid() = user_id);

drop policy if exists "check ins own update" on public.check_ins;
create policy "check ins own update" on public.check_ins
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "check ins own delete" on public.check_ins;
create policy "check ins own delete" on public.check_ins
for delete using (auth.uid() = user_id);

drop policy if exists "user badges own select" on public.user_badges;
create policy "user badges own select" on public.user_badges
for select using (auth.uid() = user_id);

drop policy if exists "user badges own insert" on public.user_badges;
create policy "user badges own insert" on public.user_badges
for insert with check (auth.uid() = user_id);

drop policy if exists "user badges own update" on public.user_badges;
create policy "user badges own update" on public.user_badges
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user badges own delete" on public.user_badges;
create policy "user badges own delete" on public.user_badges
for delete using (auth.uid() = user_id);

drop policy if exists "paywall events own select" on public.paywall_events;
create policy "paywall events own select" on public.paywall_events
for select using (auth.uid() = user_id);

drop policy if exists "paywall events own insert" on public.paywall_events;
create policy "paywall events own insert" on public.paywall_events
for insert with check (auth.uid() = user_id);

drop policy if exists "paywall events own update" on public.paywall_events;
create policy "paywall events own update" on public.paywall_events
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "paywall events own delete" on public.paywall_events;
create policy "paywall events own delete" on public.paywall_events
for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatar-assets', 'avatar-assets', true)
on conflict (id) do nothing;

drop policy if exists "avatar storage public read" on storage.objects;
create policy "avatar storage public read" on storage.objects
for select using (bucket_id = 'avatar-assets');

drop policy if exists "avatar storage authenticated write" on storage.objects;
create policy "avatar storage authenticated write" on storage.objects
for insert with check (bucket_id = 'avatar-assets' and auth.role() = 'authenticated');

drop policy if exists "avatar storage authenticated update" on storage.objects;
create policy "avatar storage authenticated update" on storage.objects
for update using (bucket_id = 'avatar-assets' and auth.role() = 'authenticated')
with check (bucket_id = 'avatar-assets' and auth.role() = 'authenticated');
