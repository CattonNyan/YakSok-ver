# 약속 (Yakssok) — AI 기반 스마트 복약 관리 서비스

> 약, 속 시원하게 관리하다

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.local.example .env.local
```

| 변수명 | 설명 | 발급처 |
|--------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | supabase.com |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard |
| `ANTHROPIC_API_KEY` | Claude API 키 | console.anthropic.com |
| `MFDS_API_KEY` | 식약처 공공데이터 API | data.go.kr |

### 3. Supabase DB 스키마 적용
Supabase Dashboard → SQL Editor에서 `supabase-schema.sql` 전체 내용을 실행하세요.

### 4. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000

---

## 📁 프로젝트 구조

```
yakssok/
├── app/
│   ├── page.tsx                  # 랜딩 페이지
│   ├── auth/login, signup        # 인증
│   ├── dashboard/                # 오늘의 복약 대시보드
│   ├── search/                   # 약 검색 (텍스트 + AI 이미지)
│   ├── schedule/                 # 복약 일정 관리
│   ├── calendar/                 # 복약 달력
│   ├── interaction/              # 약물 상호작용
│   ├── chat/                     # AI 상담 챗봇
│   └── api/                      # API Routes
├── components/                   # 재사용 컴포넌트
├── lib/supabase/                 # Supabase 클라이언트
├── types/index.ts                # TypeScript 타입
├── middleware.ts                 # 인증 미들웨어
└── supabase-schema.sql           # DB 스키마
```

## 🛠 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL)
- **AI**: Anthropic Claude (Vision + Chat)
- **의약품 DB**: 식약처 공공데이터 API
- **배포**: Vercel

## ⚠️ 주의사항
본 서비스는 참고용이며 의료 진단을 대체하지 않습니다.