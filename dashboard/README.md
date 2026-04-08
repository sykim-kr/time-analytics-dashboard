# 시간 기반 분석 대시보드

Mixpanel 데이터를 기반으로 시간 기반 분석 프레임워크의 6개 분석 주제를 시각화하는 대시보드입니다.

## 분석 탭

1. **Calendar Time** — 시간대/요일/월초월말 기준 행동 패턴
2. **Time-to-X** — 특정 행동까지 걸리는 시간 (전환 시간)
3. **코호트 & 리텐션** — cohort별 유지율과 행동 차이
4. **Velocity / Lag** — 행동 빈도, 세션 간격, 퍼널 지연
5. **Lifecycle** — 신규→활성→반복→휴면→이탈→복귀 상태 관리
6. **External Context** — 캠페인, 급여일, 공휴일 맥락 분석

## 시작하기

### 설치

```bash
npm install
```

### 환경 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하세요:

```
MIXPANEL_CLIENT_ID=your_client_id
MIXPANEL_CLIENT_SECRET=your_client_secret
MIXPANEL_REDIRECT_URI=http://localhost:3000/api/mixpanel/callback
COOKIE_SECRET=your_random_secret_32chars
USE_MOCK=true
```

Mock 모드(`USE_MOCK=true`)에서는 Mixpanel 자격 증명 없이도 대시보드를 체험할 수 있습니다.

### 실행

```bash
npm run dev
```

http://localhost:3000 에서 대시보드를 확인하세요.

## 사용 방법

1. "Mixpanel 인증하기" 버튼 클릭
2. 프로젝트 선택
3. 6개 탭을 전환하며 분석 확인
4. 각 탭의 "분석 이벤트 설정"에서 이벤트 변경 가능

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Recharts
- TanStack Query
- zod

## 프로젝트 구조

- `app/` — Next.js 페이지와 API 라우트
- `components/` — React 컴포넌트 (auth, dashboard, charts, tabs)
- `lib/` — 유틸리티, 타입, 목 데이터
- `contexts/` — React Context (인증 상태)
