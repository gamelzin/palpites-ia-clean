-- Supabase schema for palpites.IA PLUS

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  phone text unique,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists picks (
  id serial primary key,
  match text,
  market text,
  selection text,
  odds numeric,
  edge numeric,
  result text default 'pending',
  created_at timestamptz default now()
);

create index if not exists picks_created_idx on picks (created_at);

create table if not exists send_logs (
  id serial primary key,
  subscriber_id uuid,
  type text,
  sent_at timestamptz,
  payload text
);

create index if not exists send_logs_sent_idx on send_logs (sent_at);
