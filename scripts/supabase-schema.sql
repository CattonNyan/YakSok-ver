-- =============================================
-- 약속 (Yakssok) - Supabase DB Schema
-- Supabase SQL Editor에서 순서대로 실행하세요
-- =============================================

-- 1. 사용자 프로필 (Supabase Auth users 확장)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  provider text default 'email', -- email | kakao | google | naver
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 의약품 정보 (식약처 API 캐시 + 사용자 등록)
create table if not exists public.medications (
  id uuid default gen_random_uuid() primary key,
  item_seq text unique,           -- 식약처 품목일련번호
  item_name text not null,        -- 약품명
  entp_name text,                 -- 제조사
  class_name text,                -- 분류
  efficacy text,                  -- 효능·효과
  usage_info text,                -- 용법·용량
  caution text,                   -- 주의사항
  side_effect text,               -- 부작용
  interaction_info text,          -- 상호작용
  image_url text,                 -- 약 이미지
  created_at timestamptz default now()
);

-- 3. 복약 일정
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  medication_id uuid references public.medications(id) not null,
  start_date date not null,
  end_date date,
  time_slots text[] not null default '{}', -- ['morning','lunch','dinner','bedtime']
  dosage text,                    -- 1회 복용량
  memo text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. 복약 기록
create table if not exists public.medication_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  medication_id uuid references public.medications(id) not null,
  log_date date not null,
  time_slot text not null,        -- morning | lunch | dinner | bedtime
  taken boolean default false,
  taken_at timestamptz,
  created_at timestamptz default now(),
  unique(schedule_id, log_date, time_slot)
);

-- 5. 약물 상호작용 데이터
create table if not exists public.drug_interactions (
  id uuid default gen_random_uuid() primary key,
  medication_a_id uuid references public.medications(id),
  medication_b_id uuid references public.medications(id),
  severity text check (severity in ('low','medium','high','contraindicated')),
  description text,
  source text default 'mfds',
  created_at timestamptz default now(),
  unique(medication_a_id, medication_b_id)
);

-- 6. AI 챗봇 대화 기록
create table if not exists public.chat_histories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS) 설정
-- =============================================

alter table public.profiles enable row level security;
alter table public.schedules enable row level security;
alter table public.medication_logs enable row level security;
alter table public.chat_histories enable row level security;

-- profiles: 본인만
create policy "본인 프로필 조회" on public.profiles for select using (auth.uid() = id);
create policy "본인 프로필 수정" on public.profiles for update using (auth.uid() = id);
create policy "회원가입시 프로필 생성" on public.profiles for insert with check (auth.uid() = id);

-- schedules: 본인만
create policy "본인 일정 조회" on public.schedules for select using (auth.uid() = user_id);
create policy "본인 일정 생성" on public.schedules for insert with check (auth.uid() = user_id);
create policy "본인 일정 수정" on public.schedules for update using (auth.uid() = user_id);
create policy "본인 일정 삭제" on public.schedules for delete using (auth.uid() = user_id);

-- medication_logs: 본인만
create policy "본인 복약기록 조회" on public.medication_logs for select using (auth.uid() = user_id);
create policy "본인 복약기록 생성" on public.medication_logs for insert with check (auth.uid() = user_id);
create policy "본인 복약기록 수정" on public.medication_logs for update using (auth.uid() = user_id);

-- chat_histories: 본인만
create policy "본인 채팅 조회" on public.chat_histories for select using (auth.uid() = user_id);
create policy "본인 채팅 생성" on public.chat_histories for insert with check (auth.uid() = user_id);
create policy "본인 채팅 수정" on public.chat_histories for update using (auth.uid() = user_id);

-- medications & drug_interactions: 모두 읽기 가능, 인증 사용자 캐시 저장 가능
alter table public.medications enable row level security;
create policy "의약품 전체 조회" on public.medications for select using (true);
create policy "의약품 캐시 저장" on public.medications for insert with check (auth.uid() is not null);
create policy "의약품 캐시 갱신" on public.medications for update using (auth.uid() is not null);

alter table public.drug_interactions enable row level security;
create policy "상호작용 전체 조회" on public.drug_interactions for select using (true);

-- =============================================
-- 낱알식별 컬럼 추가 마이그레이션
-- (이미 medications 테이블이 있는 경우 이 블록만 실행)
-- =============================================

alter table public.medications
  add column if not exists drug_shape      text,   -- 모양: 원형, 타원형, 장방형 등
  add column if not exists color_class1   text,   -- 주 색상: 하양, 노랑, 분홍 등
  add column if not exists color_class2   text,   -- 보조 색상 (투톤)
  add column if not exists print_front    text,   -- 앞면 인쇄 문자
  add column if not exists print_back     text,   -- 뒷면 인쇄 문자
  add column if not exists mark_code_front text,  -- 앞면 각인
  add column if not exists mark_code_back  text,  -- 뒷면 각인
  add column if not exists form_code_name text,   -- 제형: 필름코팅정, 캡슐제 등
  add column if not exists chart          text;   -- 성상 설명

-- 모양 검색 성능 인덱스
create index if not exists idx_medications_drug_shape    on public.medications(drug_shape);
create index if not exists idx_medications_color_class1  on public.medications(color_class1);
create index if not exists idx_medications_print_front   on public.medications(print_front);
create index if not exists idx_medications_print_back    on public.medications(print_back);
create index if not exists idx_medications_form_code     on public.medications(form_code_name);

-- =============================================
-- 성능 인덱스 추가
-- =============================================

-- medications: 이름 검색(ilike %q%) 속도 향상을 위한 trigram 인덱스
-- pg_trgm 익스텐션이 없으면 아래 두 줄을 먼저 실행:
--   create extension if not exists pg_trgm;
create index if not exists idx_medications_item_name_trgm
  on public.medications using gin (item_name gin_trgm_ops);

-- medications: 캐시 TTL 판단에 쓰이는 created_at 범위 조회
create index if not exists idx_medications_created_at
  on public.medications(created_at);

-- schedules: user_id 필터 (RLS + 조회 모두 사용)
create index if not exists idx_schedules_user_id
  on public.schedules(user_id);

-- schedules: 대시보드의 is_active + start_date/end_date 복합 조건
create index if not exists idx_schedules_user_active
  on public.schedules(user_id, is_active, start_date);

-- medication_logs: 대시보드·달력의 user_id + log_date 범위 조회 (가장 빈번한 쿼리)
create index if not exists idx_medication_logs_user_date
  on public.medication_logs(user_id, log_date);

-- profiles: id PK 이외 추가 인덱스 불필요 (PK가 이미 인덱스)

-- =============================================
-- 자동 프로필 생성 트리거
-- =============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'provider', 'email')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();