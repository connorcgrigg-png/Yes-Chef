-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Collections
create table public.collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text default '#6366f1',
  icon text default '📁',
  created_at timestamptz default now()
);
alter table public.collections enable row level security;
create policy "Users manage own collections" on public.collections for all using (auth.uid() = user_id);

-- Tags
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  unique(user_id, name)
);
alter table public.tags enable row level security;
create policy "Users manage own tags" on public.tags for all using (auth.uid() = user_id);

-- Recipes
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  source_url text,
  source_type text check (source_type in ('url', 'pdf', 'image', 'manual')) default 'manual',
  image_url text,
  feeds_people integer,
  prep_time_minutes integer,
  cook_time_minutes integer,
  total_time_minutes integer,
  ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.recipes enable row level security;
create policy "Users manage own recipes" on public.recipes for all using (auth.uid() = user_id);
create index on public.recipes using gin(ingredients);
create index on public.recipes (user_id, created_at desc);

-- Full text search index
alter table public.recipes add column search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(notes, ''))
  ) stored;
create index on public.recipes using gin(search_vector);

-- Recipe <-> Collection join
create table public.recipe_collections (
  recipe_id uuid references public.recipes on delete cascade,
  collection_id uuid references public.collections on delete cascade,
  primary key (recipe_id, collection_id)
);
alter table public.recipe_collections enable row level security;
create policy "Users manage own recipe_collections" on public.recipe_collections for all
  using (exists (select 1 from public.recipes where id = recipe_id and user_id = auth.uid()));

-- Recipe <-> Tag join
create table public.recipe_tags (
  recipe_id uuid references public.recipes on delete cascade,
  tag_id uuid references public.tags on delete cascade,
  primary key (recipe_id, tag_id)
);
alter table public.recipe_tags enable row level security;
create policy "Users manage own recipe_tags" on public.recipe_tags for all
  using (exists (select 1 from public.recipes where id = recipe_id and user_id = auth.uid()));

-- Pantry items
create table public.pantry_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  quantity text,
  unit text,
  category text,
  added_at timestamptz default now()
);
alter table public.pantry_items enable row level security;
create policy "Users manage own pantry" on public.pantry_items for all using (auth.uid() = user_id);
create index on public.pantry_items (user_id);

-- Update updated_at automatically
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger recipes_updated_at before update on public.recipes
  for each row execute procedure public.update_updated_at();
