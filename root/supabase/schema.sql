-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,

  constraint full_name_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table public.profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage for files
-- Note: Buckets must be created in the dashboard or via API
-- The following SQL sets up the policies for a bucket named 'files'
insert into storage.buckets (id, name, public) 
values ('files', 'files', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own files"
on storage.objects for select
to authenticated
using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own files"
on storage.objects for update
to authenticated
using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Backend Metadata Table
-- Used by the Node.js backend to track files stored temporarily on the server
create table public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  filename text not null,
  size bigint not null,
  path text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Index for fast cleanup queries
create index idx_files_expires_at on public.files(expires_at);

-- RLS for backend table
alter table public.files enable row level security;

-- Only the server (via Service Role) needs full access, but we allows users to view their own file metadata
create policy "Users can view own file metadata"
  on public.files for select
  using (auth.uid() = user_id);
