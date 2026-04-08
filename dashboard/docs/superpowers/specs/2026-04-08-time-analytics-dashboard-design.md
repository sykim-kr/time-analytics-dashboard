# Time-based Mixpanel Analytics Dashboard — Design Spec

**Date:** 2026-04-08
**Status:** Draft

---

## 1. Overview

Mixpanel 데이터를 기반으로 시간 기반 분석 프레임워크의 6개 분석 주제를 시각화하는 단일 페이지 웹 대시보드.

### 대상 사용자
마케터/비즈니스팀 — 분석 도구에 익숙하지 않은 사람도 직관적으로 인사이트를 얻을 수 있어야 한다.

### 핵심 플로우
1. 사용자가 "Mixpanel 인증하기" 클릭
2. Mixpanel OAuth 로그인 & 권한 승인
3. 인증 성공 후 프로젝트 리스트 표시
4. 프로젝트 선택 시 6개 분석 탭 활성화
5. 각 탭에서 KPI + 차트 + 인사이트 확인

### 기술 스택
- Next.js App Router + TypeScript
- Tailwind CSS
- Recharts (히트맵은 CSS grid 기반 커스텀 컴포넌트로 구현)
- TanStack Query (클라이언트 데이터 페칭, 캐싱, 재시도)
- zod (입력 검증)

### UI 언어
한국어 (분석 용어는 영어 원문 유지 — Calendar Time, Time-to-X 등 도메인 친숙성을 위해)

---

## 2. 아키텍처: 단일 페이지 대시보드

하나의 페이지(`page.tsx`)에 상단 헤더(인증 + 프로젝트 선택)와 탭 네비게이션을 배치. 탭 전환은 클라이언트 상태로 관리하며 URL은 변경하지 않는다.

**선택 이유:**
- 빠른 탭 전환 (SPA 느낌)
- 마케터에게 친숙한 대시보드 패턴
- 구조가 심플하여 유지보수 용이
- 탭별 lazy loading으로 성능 확보

---

## 3. OAuth 인증 플로우

### 흐름

```
사용자 클릭 "Mixpanel 인증하기"
  → 프론트엔드: /api/mixpanel/auth 호출
  → 서버: random state 생성 → httpOnly 쿠키에 저장
  → 서버: Mixpanel OAuth authorize URL 생성 (state 포함) → 리다이렉트
  → 사용자: Mixpanel 로그인 & 권한 승인
  → Mixpanel: callback URL로 code + state 전달
  → 서버: /api/mixpanel/callback에서 state 검증 (CSRF 방지)
  → 서버: code → access_token 교환
  → 서버: token을 httpOnly 쿠키에 저장, state 쿠키 삭제
  → 프론트엔드로 리다이렉트 (인증 완료 상태)
  → 자동으로 /api/mixpanel/projects 호출 → 프로젝트 리스트 표시
```

> **참고:** 워크플로우 문서에서는 서비스 계정 방식을 기술하고 있으나, 사용자 요구에 따라 OAuth를 채택한다. 서비스 계정 방식은 Phase 2에서 fallback 옵션으로 고려할 수 있다.

### 상태 모델

| 상태 | UI 표시 | 트리거 |
|------|---------|--------|
| `idle` | "Mixpanel 인증하기" 버튼 | 초기 상태 |
| `authenticating` | 버튼 로딩 스피너 | 버튼 클릭 |
| `authenticated` | ✓ 연결됨 배지 | OAuth 콜백 성공 |
| `loading_projects` | 프로젝트 드롭다운 로딩 스피너 | 인증 성공 직후 |
| `project_selected` | 프로젝트명 표시 | 프로젝트 선택 |
| `loading_analysis` | 탭 콘텐츠 스켈레톤 | 탭 데이터 로딩 중 |
| `ready` | 탭 데이터 렌더링 | 분석 데이터 로드 완료 |
| `error` | 에러 메시지 + 재시도 버튼 | API 실패 |

### 토큰 관리
- access_token은 httpOnly 쿠키에 저장 (브라우저 JS 접근 불가)
- 서버 API route에서만 토큰을 읽어 Mixpanel API 호출
- Mixpanel OAuth는 refresh token을 제공하지 않음
- 토큰 만료(또는 서버에서 401 응답) 시: 프론트엔드에 `auth_expired` 상태 반환 → 재인증 유도
- 모든 API route에서 401 감지 시 `{ error: "auth_expired" }` 반환, 프론트엔드에서 인증 버튼으로 복귀
- 로그아웃 시 쿠키 삭제

### 클라이언트 상태 관리
- React Context (`MixpanelAuthContext`)로 인증 상태 관리
- TanStack Query로 데이터 페칭, 캐싱, 재시도, 로딩 상태 관리
- 탭별 데이터는 각 탭 컴포넌트에서 `useQuery`로 독립 관리

---

## 4. 레이아웃 구조

다크 테마 기반 대시보드.

### 상단 헤더
- 앱 타이틀: "시간 기반 분석"
- Mixpanel 인증 버튼 (상태에 따라 변화)
- 프로젝트 선택 드롭다운
- 연결 상태 배지

### 탭 네비게이션
6개 탭, 아이콘 + 한국어 라벨:
1. 📅 Calendar Time
2. ⏱ Time-to-X
3. 📊 코호트 & 리텐션
4. 🚀 Velocity / Lag
5. 🔄 Lifecycle
6. 🌍 External Context

### 탭 내부 공통 구조
- KPI 카드 4개 (4열 그리드, 변화율 포함)
- 차트 영역 (2열 그리드, 메인 + 보조)
- 추가 차트 1개 (선택적)
- 인사이트 bullet 3개

---

## 5. 탭별 분석 설계

### 공통 API 응답 구조

```ts
// 차트 데이터 타입 (차트 종류별 discriminated union)
type LineChartData = { x: string; [series: string]: number | string }[];
type BarChartData = { label: string; value: number; group?: string }[];
type HeatmapChartData = { x: string; y: string; value: number }[];
type TableChartData = { columns: string[]; rows: (string | number)[][] };
type AreaChartData = { x: string; [series: string]: number | string }[];
type ScatterChartData = { x: number; y: number; label?: string }[];

type ChartConfig =
  | { id: string; type: "line"; title: string; data: LineChartData }
  | { id: string; type: "bar"; title: string; data: BarChartData }
  | { id: string; type: "heatmap"; title: string; data: HeatmapChartData }
  | { id: string; type: "table"; title: string; data: TableChartData }
  | { id: string; type: "area"; title: string; data: AreaChartData }
  | { id: string; type: "scatter"; title: string; data: ScatterChartData };

type AnalysisResponse = {
  projectId: number;
  analysisType: "calendar" | "timetox" | "retention" | "velocity" | "lifecycle" | "context";
  status: "ok" | "partial" | "empty" | "error";
  requiredEvents?: string[];
  requiredProperties?: string[];
  metrics: Array<{ label: string; value: string | number; change?: string }>;
  charts: ChartConfig[];
  insights: string[];
  warnings?: string[];
}

// API 에러 응답 (HTTP 4xx/5xx)
type ApiErrorResponse = {
  error: string;
  code: "auth_expired" | "invalid_params" | "upstream_error" | "rate_limited" | "not_found";
  details?: string;
}
// HTTP 상태 코드: 401(인증 만료), 400(잘못된 파라미터), 502(Mixpanel 오류), 429(요청 제한)
// 200 + status: "error"는 데이터 레벨 이슈 (이벤트 없음 등)
```

### 이벤트 선택기 (Event Selector)

각 탭은 분석에 사용할 이벤트를 사용자가 직접 선택/변경할 수 있는 "분석 이벤트 설정" 바를 탭 콘텐츠 상단에 표시한다.

**동작 방식:**
1. 프로젝트 선택 시 `/api/mixpanel/schema`로 이벤트 목록 조회
2. 각 탭의 이벤트 슬롯에 후보군 자동 매핑 (예: signup → `Sign Up`, `Signup`, `User Signed Up` 중 존재하는 것)
3. 사용자가 드롭다운으로 다른 이벤트 선택 가능
4. "적용" 버튼 클릭 시 선택된 이벤트로 분석 데이터 재호출
5. KPI 카드와 차트 제목에 현재 기준 이벤트명 표시 (어떤 이벤트 기준인지 명확)

**탭별 이벤트 슬롯:**

| 탭 | 슬롯 | 역할 | 기본값 |
|---|---|---|---|
| Calendar Time | 핵심 이벤트 | 시간대/요일 분석 대상 | App Open |
| Calendar Time | 전환 이벤트 | 전환율 계산 대상 | Purchase |
| Calendar Time | 탐색 이벤트 | 탐색 패턴 분석 | Page View |
| Time-to-X | 퍼널 시작 | 퍼널 첫 단계 | Sign Up |
| Time-to-X | 퍼널 중간 (선택) | 퍼널 중간 단계, 추가/삭제 가능 | Add to Cart |
| Time-to-X | 퍼널 완료 | 퍼널 마지막 단계 | Purchase |
| 코호트 & 리텐션 | 코호트 기준 | 코호트 분류 기준 | Sign Up |
| 코호트 & 리텐션 | 리텐션 측정 | 재방문 측정 이벤트 | App Open |
| Velocity / Lag | 빈도 측정 | 행동 빈도 대상 | Any Event |
| Velocity / Lag | 세션 이벤트 | 세션 간격 분석 | Session Start |
| Velocity / Lag | 전환 이벤트 | Fast/Slow 비교 대상 | Purchase |
| Lifecycle | 가입 이벤트 | Lifecycle 시작점 | Sign Up |
| Lifecycle | 활성 측정 | 활성/휴면 판단 기준 | App Open |
| External Context | 분석 대상 | 맥락별 비교 대상 | Purchase |
| External Context | 비교 기준 속성 | 맥락 구분 속성 | campaign |

**Time-to-X 퍼널 특수 UI:** 시작 → 중간 → 완료 단계를 화살표로 시각적 연결. "+ 단계 추가" 버튼으로 중간 단계 추가 가능.

**API 반영:** 분석 API에 `events` 파라미터 추가.
```
GET /api/mixpanel/analysis/calendar?projectId=123&events.primary=App+Open&events.conversion=Purchase&events.browse=Page+View
GET /api/mixpanel/analysis/timetox?projectId=123&events.funnel=Sign+Up,Add+to+Cart,Purchase
GET /api/mixpanel/analysis/retention?projectId=123&events.cohort=Sign+Up&events.return=App+Open
```

**컴포넌트:** `components/dashboard/EventSelector.tsx` — 탭별 슬롯 설정을 받아 드롭다운 렌더링. 선택 변경 시 부모 탭에 콜백.

```ts
type EventSlot = {
  key: string;        // "primary", "conversion", "funnel" 등
  label: string;      // "핵심 이벤트", "전환 이벤트" 등
  defaultCandidates: string[];  // 자동 매핑 후보군
  required: boolean;
  value?: string;     // 현재 선택된 이벤트명
}

type EventSelectorProps = {
  slots: EventSlot[];
  availableEvents: string[];  // 스키마에서 가져온 전체 이벤트 목록
  onChange: (selections: Record<string, string>) => void;
  variant?: "default" | "funnel";  // Time-to-X는 funnel 레이아웃
}
```

---

### 5.1 Calendar Time (📅 캘린더 시간)

**목적:** 시간대/요일/월초월말/시간 블록 기준 행동 패턴 시각화

**이벤트 슬롯:** 핵심 이벤트(App Open), 전환 이벤트(Purchase), 탐색 이벤트(Page View)

| 구성 | 내용 |
|------|------|
| KPI 4개 | 피크 시간대(핵심), 주말 전환율(전환/핵심), 월말 매출 비중(전환), 골든 타임 CVR(전환/핵심) |
| 차트 1 | 시간대별 이벤트 추이 (Bar) — 0~23시, 기준: 핵심 이벤트 |
| 차트 2 | 요일 × 시간대 히트맵 (Heatmap), 기준: 핵심 이벤트 |
| 차트 3 | 월초/월중/월말 비교 (Bar), 기준: 전환 이벤트 |
| 인사이트 | 골든 타임 발견, 주중/주말 패턴 차이, 월말 효과 |

**서버 후처리:** 시간 bucket, month_phase(early/mid/late), time_block(commute/work_morning/lunch/...) 계산

### 5.2 Time-to-X (⏱ 전환 시간)

**목적:** 특정 행동까지 걸리는 시간 시각화 — UX 품질 + 전환 효율 지표

**이벤트 슬롯 (funnel 레이아웃):** 퍼널 시작(Sign Up) → 퍼널 중간(Add to Cart, 선택) → 퍼널 완료(Purchase). 중간 단계 추가/삭제 가능.

| 구성 | 내용 |
|------|------|
| KPI 4개 | 평균 전환 시간(시작→완료), 중앙값, Fast 유저 비율, 이탈 구간 |
| 차트 1 | 시작→첫 행동 시간 분포 (Histogram) |
| 차트 2 | 퍼널 단계별 소요 시간 (Funnel Lag Bar) |
| 차트 3 | Fast vs Slow 유저 비교 (Bar) |
| 인사이트 | 전환 지연 구간, 이탈 위험 시점, CRM 개입 타이밍 |

### 5.3 코호트 & 리텐션 (📊)

**목적:** cohort별 유지율과 행동 차이 비교

**이벤트 슬롯:** 코호트 기준(Sign Up), 리텐션 측정(App Open)

| 구성 | 내용 |
|------|------|
| KPI 4개 | D1 리텐션, D7 리텐션, D30 리텐션, Plateau 시점 |
| 차트 1 | 리텐션 커브 (Line — D0~D30), 기준: 코호트→리텐션 이벤트 |
| 차트 2 | 코호트 테이블 (Table/Heatmap) |
| 차트 3 | 채널별 리텐션 비교 (Multi-line) |
| 인사이트 | 이탈 급락 시점, 습관 형성 여부, 채널 품질 |

### 5.4 Velocity / Lag (🚀)

**목적:** 행동 빈도, 세션 간격, 퍼널 단계 간 지연 분석

**이벤트 슬롯:** 빈도 측정(Any Event), 세션 이벤트(Session Start), 전환 이벤트(Purchase)

| 구성 | 내용 |
|------|------|
| KPI 4개 | 인당 이벤트 수(빈도), 평균 세션 간격(세션), 퍼널 Lag, High Intent 비율(전환) |
| 차트 1 | 유저별 이벤트 빈도 분포 (Bar), 기준: 빈도 측정 이벤트 |
| 차트 2 | 세션 간격 추이 (Line), 기준: 세션 이벤트 |
| 차트 3 | Fast vs Slow 구매 유저 비교 (Bar), 기준: 전환 이벤트 |
| 인사이트 | High intent 유저 특성, Churn 초기 신호, 행동 밀도 |

### 5.5 Lifecycle (🔄)

**목적:** 신규→활성→반복→휴면→이탈→복귀 상태 전환 관리

**이벤트 슬롯:** 가입 이벤트(Sign Up), 활성 측정 이벤트(App Open)

| 구성 | 내용 |
|------|------|
| KPI 4개 | 활성 유저 비율, 휴면 유저 비율, Churn Rate, 복귀율 |
| 차트 1 | Lifecycle 상태 분포 (Stacked Bar), 기준: 활성 측정 이벤트 |
| 차트 2 | Churn 위험 추이 (Line) |
| 차트 3 | 복귀(Reactivation) 트렌드 (Line) |
| 인사이트 | Churn 전 신호, 개입 타이밍, VIP 유저 정의 |

**Lifecycle 상태 정의 (서버에서 파생, 활성 측정 이벤트 기준):**
- 신규: 7일 내 가입(가입 이벤트 기준)
- 활성: 7일 내 활동(활성 측정 이벤트 기준)
- 반복: 2회 이상 활동
- 휴면: 7~30일 미활동
- 이탈: 30일+ 미활동
- 복귀: 이탈 후 재방문

### 5.6 External Context (🌍)

**목적:** 캠페인, 급여일, 공휴일, 릴리즈 등 맥락과 행동 변화 연결

**이벤트 슬롯:** 분석 대상 이벤트(Purchase), 비교 기준 속성(campaign)

| 구성 | 내용 |
|------|------|
| KPI 4개 | 캠페인 Lift, 급여일 효과, 공휴일 트래픽 변화, Before/After 차이 |
| 차트 1 | 캠페인 기간 전/중/후 비교 (Line + Area), 기준: 분석 대상 이벤트 |
| 차트 2 | 급여일 전후 구매 패턴 (Bar), 기준: 분석 대상 이벤트 |
| 차트 3 | 공휴일 vs 평일 비교 (Bar), 기준: 분석 대상 이벤트 |
| 인사이트 | 진짜 원인 vs 착시 구분, 타이밍 기반 마케팅 기회 |

---

## 6. 공통 UI 상태

| 상태 | 렌더링 |
|------|--------|
| Loading | 스켈레톤 UI (KPI 카드 + 차트 영역 shimmer) |
| Empty | "이 프로젝트에서 [이벤트명] 이벤트를 찾지 못했습니다" + 필요 이벤트 목록 안내 |
| Partial | 일부 차트만 렌더 + 상단 경고 배너 |
| Error | 에러 메시지 + 재시도 버튼 |

에러 메시지 예시:
- "Mixpanel 인증에 실패했습니다. 다시 시도해 주세요."
- "이 프로젝트에서 Purchase 이벤트를 찾지 못했습니다."
- "이 분석을 계산하려면 Sign Up 이벤트가 필요합니다."
- "Mixpanel 응답 제한으로 인해 잠시 후 다시 시도해 주세요."

---

## 7. 프로젝트 구조

```
dashboard/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ api/
│  │  └─ mixpanel/
│  │     ├─ auth/route.ts
│  │     ├─ callback/route.ts
│  │     ├─ logout/route.ts
│  │     ├─ projects/route.ts
│  │     ├─ schema/route.ts
│  │     └─ analysis/
│  │        ├─ calendar/route.ts
│  │        ├─ timetox/route.ts
│  │        ├─ retention/route.ts
│  │        ├─ velocity/route.ts
│  │        ├─ lifecycle/route.ts
│  │        └─ context/route.ts
├─ components/
│  ├─ auth/
│  │  ├─ ConnectMixpanelButton.tsx
│  │  └─ ProjectSelector.tsx
│  ├─ dashboard/
│  │  ├─ DashboardHeader.tsx
│  │  ├─ AnalysisTabs.tsx
│  │  ├─ TabContent.tsx
│  │  ├─ EventSelector.tsx        # 탭별 이벤트 선택기
│  │  ├─ KpiCards.tsx
│  │  ├─ InsightList.tsx
│  │  ├─ WarningBanner.tsx
│  │  ├─ EmptyState.tsx
│  │  └─ LoadingSkeleton.tsx
│  ├─ charts/
│  │  ├─ TimeSeriesChart.tsx
│  │  ├─ HeatmapChart.tsx
│  │  ├─ RetentionCurveChart.tsx
│  │  ├─ FunnelLagChart.tsx
│  │  ├─ ComparisonBarChart.tsx
│  │  ├─ DistributionChart.tsx
│  │  └─ CohortTable.tsx
│  └─ tabs/
│     ├─ CalendarTab.tsx
│     ├─ TimeToXTab.tsx
│     ├─ RetentionTab.tsx
│     ├─ VelocityTab.tsx
│     ├─ LifecycleTab.tsx
│     └─ ContextTab.tsx
├─ lib/
│  ├─ mixpanel/
│  │  ├─ client.ts
│  │  ├─ auth.ts
│  │  ├─ projects.ts
│  │  ├─ schemas.ts
│  │  ├─ query.ts
│  │  └─ analysis/
│  │     ├─ calendar.ts
│  │     ├─ timetox.ts
│  │     ├─ retention.ts
│  │     ├─ velocity.ts
│  │     ├─ lifecycle.ts
│  │     └─ context.ts
│  ├─ mock/
│  │  ├─ calendar.ts
│  │  ├─ timetox.ts
│  │  ├─ retention.ts
│  │  ├─ velocity.ts
│  │  ├─ lifecycle.ts
│  │  └─ context.ts
│  └─ types.ts
├─ contexts/
│  └─ MixpanelAuthContext.tsx
├─ .env.example
└─ README.md
```

### 컴포넌트 계층

```
page.tsx
├─ MixpanelAuthProvider
│  ├─ DashboardHeader
│  │  ├─ ConnectMixpanelButton
│  │  └─ ProjectSelector
│  └─ AnalysisTabs
│     └─ TabContent (공통 래퍼: loading/empty/error)
│        ├─ EventSelector (탭별 이벤트 선택기)
│        ├─ KpiCards
│        ├─ [차트 컴포넌트들]
│        └─ InsightList
```

### 설계 원칙
- **탭 컴포넌트 (`tabs/`):** API 호출 + 차트/KPI 조합만 담당
- **차트 컴포넌트 (`charts/`):** 데이터를 받아 렌더링만 수행. 7개로 6개 탭 전체 커버
- **분석 어댑터 (`lib/mixpanel/analysis/`):** Mixpanel 원시 데이터 → 차트 데이터 변환
- **Mock 데이터 (`lib/mock/`):** 실제 API와 동일한 shape. 환경변수 플래그로 전환

---

## 8. API 설계

### 인증
- `GET /api/mixpanel/auth` — OAuth authorize URL 생성 후 리다이렉트
- `GET /api/mixpanel/callback` — OAuth code→token 교환, httpOnly 쿠키 저장
- `POST /api/mixpanel/logout` — 쿠키 삭제

### 프로젝트
- `GET /api/mixpanel/projects` — 인증된 사용자의 프로젝트 리스트

### 스키마
- `GET /api/mixpanel/schema?projectId=12345` — 프로젝트의 이벤트/속성 목록

스키마 응답 타입:
```ts
type SchemaResponse = {
  events: Array<{
    name: string;
    properties: Array<{ name: string; type: string }>;
  }>;
  userProperties: Array<{ name: string; type: string }>;
}
```

### 분석 (6개)

공통 쿼리 파라미터:
- `projectId` (필수): Mixpanel 프로젝트 ID
- `period` (선택): `7d` | `30d` | `90d` — 기본값 `30d`
- `from` / `to` (선택): ISO 날짜 문자열 — `period` 대신 사용 가능

```
GET /api/mixpanel/analysis/calendar?projectId=12345&period=30d
GET /api/mixpanel/analysis/timetox?projectId=12345&period=30d
GET /api/mixpanel/analysis/retention?projectId=12345&period=90d
GET /api/mixpanel/analysis/velocity?projectId=12345&period=30d
GET /api/mixpanel/analysis/lifecycle?projectId=12345&period=30d
GET /api/mixpanel/analysis/context?projectId=12345&from=2026-03-01&to=2026-03-31
```

성공 시 `AnalysisResponse` (HTTP 200) 반환.
에러 시 `ApiErrorResponse` (HTTP 4xx/5xx) 반환.

---

## 9. 데이터 전략

### Phase 1: Mock 데이터
- `lib/mock/` 디렉토리에 각 탭별 mock 데이터 파일
- 실제 API와 동일한 `AnalysisResponse` shape
- `USE_MOCK=true` 환경변수로 전환
- 전체 UI/UX를 mock으로 먼저 완성

### Phase 2: 실제 Mixpanel API 연결
- 스키마 조회 → 이벤트/속성 자동 매핑
- 매핑 실패 시 필요 이벤트 안내 (empty state)
- 분석별 query adapter 구현

### 이벤트 매핑 전략
- 이벤트명 하드코딩 최소화
- 스키마 조회 후 후보군 매핑 (예: signup → `Sign Up`, `Signup`, `User Signed Up`)
- 매핑 실패 시 수동 이벤트 선택 옵션 제공

---

## 10. 보안

- Mixpanel access_token은 httpOnly 쿠키에만 저장
- 브라우저 JS에서 토큰 접근 불가
- 모든 Mixpanel API 호출은 서버 API route를 통해서만 수행
- 환경변수(OAuth client_id/secret)는 `.env.local`에만 보관
- 요청 파라미터는 zod로 검증
- 시크릿 로깅 금지
- OAuth callback에서 `state` 파라미터로 CSRF 방지 (인증 플로우 참조)
- 쿠키 설정: `httpOnly`, `secure` (production), `sameSite: lax`

### 환경변수 (.env.example)

```
MIXPANEL_CLIENT_ID=           # Mixpanel OAuth 앱 client ID
MIXPANEL_CLIENT_SECRET=       # Mixpanel OAuth 앱 client secret
MIXPANEL_REDIRECT_URI=http://localhost:3000/api/mixpanel/callback
COOKIE_SECRET=                # 쿠키 서명 시크릿 (32자 이상 랜덤 문자열)
USE_MOCK=true                 # true: mock 데이터 사용, false: 실제 API
```

---

## 11. 성능

- 탭별 lazy loading (첫 탭만 eager load)
- 프로젝트 리스트: 5~15분 캐시
- 분석 결과: query params 기준 캐시
- 프로젝트 변경 시 현재 활성 탭 데이터만 즉시 재호출
