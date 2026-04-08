# Time Analytics Dashboard (Monorepo)

Mixpanel 데이터를 기반으로 시간 기반 분석 프레임워크의 6개 분석 주제를 시각화하는 대시보드입니다.

## 분석 탭

1. **Calendar Time** — 시간대/요일/월초월말 기준 행동 패턴
2. **Time-to-X** — 특정 행동까지 걸리는 시간 (전환 시간)
3. **코호트 & 리텐션** — cohort별 유지율과 행동 차이
4. **Velocity / Lag** — 행동 빈도, 세션 간격, 퍼널 지연
5. **Lifecycle** — 신규→활성→반복→휴면→이탈→복귀 상태 관리
6. **External Context** — 캠페인, 급여일, 공휴일 맥락 분석

## 프로젝트 구조

```
dashboard/
├─ frontend/          ← Next.js (Vercel)
│  ├─ app/            ← Pages and layout
│  ├─ components/     ← React components (auth, dashboard, charts, tabs)
│  ├─ contexts/       ← React Context (auth state)
│  ├─ lib/            ← Types and API helper
│  └─ package.json
├─ backend/           ← Express (Railway)
│  ├─ src/
│  │  ├─ routes/      ← API routes (auth, projects, schema, analysis)
│  │  ├─ middleware/   ← Auth middleware
│  │  └─ lib/         ← Validation and mock data
│  ├─ Dockerfile
│  └─ package.json
└─ README.md
```

## 시작하기

### 1. Backend 설치 및 실행

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on http://localhost:4000. Mock mode (`USE_MOCK=true`) is enabled by default.

### 2. Frontend 설치 및 실행

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on http://localhost:3000.

### 환경 변수

**Backend** (`backend/.env`):
```
PORT=4000
FRONTEND_URL=http://localhost:3000
USE_MOCK=true
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## 사용 방법

1. Backend와 Frontend를 각각 실행
2. http://localhost:3000 에서 "Mixpanel 인증하기" 버튼 클릭
3. 프로젝트 선택
4. 6개 탭을 전환하며 분석 확인

## 배포

### Frontend (Vercel)
- Root directory: `frontend`
- Build command: `npm run build`
- Environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`

### Backend (Railway)
- Root directory: `backend`
- Dockerfile path: `backend/Dockerfile`
- Environment variables: `FRONTEND_URL`, `USE_MOCK`, `PORT`

## 기술 스택

**Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Recharts, TanStack Query
**Backend**: Express, TypeScript, cookie-parser, cors, zod
