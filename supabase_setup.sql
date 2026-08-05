-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  state text not null,
  category text, -- General, OBC, SC, ST, EWS
  income_range text, -- e.g., "Below ₹50,000", "₹50,000 - ₹1,00,000" etc
  age integer,
  family_size integer,
  preferred_language text default 'Hindi', -- Hindi, Marathi, English
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

-- Create policies so that only the user can see and modify their own profile data.
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can view their own profile."
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for chat messages
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'ai')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) for chat_messages
alter table chat_messages enable row level security;

-- Create policies so that only the user can see and insert their own messages
create policy "Users can insert their own messages."
  on chat_messages for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own messages."
  on chat_messages for select
  using ( auth.uid() = user_id );
