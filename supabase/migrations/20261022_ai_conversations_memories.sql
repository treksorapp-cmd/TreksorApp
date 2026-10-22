-- Treksor AI conversation history and user-controlled growth memory.
-- Apply only after reviewing in a staging environment. Never store OpenAI secrets here.
create table if not exists public.ai_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'New conversation' check (char_length(title) <= 120),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id, updated_at desc);
create table if not exists public.ai_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('user','assistant')),
 content text not null check(char_length(content) between 1 and 16000),
 created_at timestamptz not null default now()
);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);
create table if not exists public.ai_memories (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('mind','body','balance','purpose','preferences')),
 content text not null check(char_length(content) between 1 and 1000),
 user_approved boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ai_memories_user_idx on public.ai_memories(user_id);
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_memories enable row level security;
revoke all on public.ai_conversations, public.ai_messages, public.ai_memories from anon;
grant select on public.ai_conversations, public.ai_messages to authenticated;
grant select,insert,update,delete on public.ai_memories to authenticated;
create policy "owner reads conversations" on public.ai_conversations for select to authenticated using ((select auth.uid())=user_id);
create policy "owner reads messages" on public.ai_messages for select to authenticated
 using ((select auth.uid())=user_id and exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy "owner manages memories" on public.ai_memories for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- AI backend must fetch only user_approved=true memories for the authenticated user.
-- AI-generated memories must be proposed to the user and explicitly approved before use.
-- Messages should be inserted by a verified backend to prevent spoofing assistant responses.
