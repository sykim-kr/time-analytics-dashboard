# Claude Code Workflow
## Mixpanel 인증 → 프로젝트 선택 → 6개 분석 탭 시각화 웹앱 구현 워크플로우

이 문서는 Claude Code가 다음 목표를 구현하도록 지시하기 위한 실행용 워크플로우입니다.

### 목표
웹페이지에서 사용자가 **Mixpanel 인증하기** 버튼을 누르면:
1. 백엔드에서 Mixpanel 인증을 처리한다.
2. 인증 성공 후 프로젝트 리스트를 조회해 드롭다운/리스트로 보여준다.
3. 사용자가 프로젝트를 선택하면 해당 프로젝트 기준으로 분석 데이터를 조회한다.
4. 아래 6개 분석 주제를 **탭 UI**로 제공한다.
   - Calendar Time 분석
   - Event-relative Time (Time-to-X)
   - Cohort & Retention Curve
   - Velocity / Lag 분석
   - Lifecycle Time
   - External Context
5. 각 탭에서 Mixpanel API 기반 데이터 시각화를 렌더링한다.

---

# 1. 구현 원칙

## 1.1 보안 원칙
- Mixpanel 서비스 계정 사용자명/시크릿은 **브라우저에 노출하지 않는다**
- 인증 및 Query API 호출은 반드시 **서버 측 프록시**를 통해 수행한다
- 프론트엔드는 액세스 상태, 프로젝트 리스트, 분석 결과만 받는다
- 환경변수는 `.env.local` 또는 서버 시크릿 스토어에만 보관한다

## 1.2 제품 원칙
- 로그인/인증보다 **분석 경험**이 먼저 보이도록 설계한다
- 사용자가 프로젝트를 고른 후 바로 6개 탭을 탐색할 수 있어야 한다
- 데이터가 아직 준비되지 않았거나 이벤트 설계가 불충분한 경우, 빈 화면 대신:
  - 필요한 이벤트/속성 안내
  - 샘플 차트 placeholder
  - “이 프로젝트에선 현재 계산 불가” 사유
  를 보여준다

## 1.3 UX 원칙
- 상단: Mixpanel 인증 상태 + 프로젝트 선택
- 본문: 탭 6개
- 탭 내부:
  - KPI cards
  - 차트 1~3개
  - 요약 인사이트
  - 데이터 가용성 경고
- 너무 긴 설명보다 “차트 + 짧은 해석” 중심

---

# 2. 권장 기술 스택

## 프론트엔드
- Next.js (App Router) 또는 React + Vite
- TypeScript
- Tailwind CSS
- Recharts 또는 ECharts
- TanStack Query

## 백엔드
- Next.js Route Handlers 또는 Express/Fastify
- TypeScript
- zod
- server-side fetch

## 데이터 계층
- Mixpanel Query API 호출 래퍼
- 프로젝트 메타데이터 조회 모듈
- 이벤트/속성 schema 캐시
- 분석별 adapter layer

---

# 3. 권장 프로젝트 구조

```text
mixpanel-time-analytics/
├─ app/
│  ├─ page.tsx
│  ├─ api/
│  │  ├─ mixpanel/
│  │  │  ├─ auth/route.ts
│  │  │  ├─ projects/route.ts
│  │  │  ├─ schema/route.ts
│  │  │  ├─ analysis/
│  │  │  │  ├─ calendar/route.ts
│  │  │  │  ├─ timetox/route.ts
│  │  │  │  ├─ retention/route.ts
│  │  │  │  ├─ velocity/route.ts
│  │  │  │  ├─ lifecycle/route.ts
│  │  │  │  └─ context/route.ts
├─ components/
│  ├─ auth/
│  │  ├─ ConnectMixpanelButton.tsx
│  │  └─ ProjectSelector.tsx
│  ├─ dashboard/
│  │  ├─ AnalysisTabs.tsx
│  │  ├─ KpiCards.tsx
│  │  ├─ EmptyState.tsx
│  │  └─ InsightSummary.tsx
│  ├─ charts/
│  │  ├─ TimeSeriesChart.tsx
│  │  ├─ HeatmapChart.tsx
│  │  ├─ RetentionCurveChart.tsx
│  │  ├─ FunnelLagChart.tsx
│  │  └─ CohortTable.tsx
├─ lib/
│  ├─ mixpanel/
│  │  ├─ client.ts
│  │  ├─ auth.ts
│  │  ├─ projects.ts
│  │  ├─ schemas.ts
│  │  ├─ query.ts
│  │  ├─ expressions.ts
│  │  └─ analysis/
│  │     ├─ calendar.ts
│  │     ├─ timetox.ts
│  │     ├─ retention.ts
│  │     ├─ velocity.ts
│  │     ├─ lifecycle.ts
│  │     └─ context.ts
├─ .env.example
├─ CLAUDE.md
├─ todo.md
└─ README.md
```

---

# 4. Mixpanel 인증/조회 아키텍처

## 4.1 인증 방식
브라우저에서 Mixpanel API를 직접 치지 말고, 서버 API에서 서비스 계정 자격증명을 사용한다.

### 권장 흐름
1. 사용자 클릭: `Mixpanel 인증하기`
2. 프론트엔드 → `/api/mixpanel/auth`
3. 서버:
   - 환경변수에 저장된 Mixpanel 자격증명 확인
   - lightweight validation 호출
   - 성공/실패 응답 반환
4. 인증 성공 시 프론트엔드 → `/api/mixpanel/projects`
5. 서버가 프로젝트 리스트 조회 후 반환
6. 사용자 프로젝트 선택
7. 프론트엔드가 해당 `project_id`로 각 분석 API 호출

## 4.2 상태 모델
- `idle`
- `authenticating`
- `authenticated`
- `loading_projects`
- `project_selected`
- `loading_analysis`
- `ready`
- `error`

---

# 5. 탭 구조

## 상위 탭 목록
1. Calendar Time
2. Time-to-X
3. Cohort & Retention
4. Velocity / Lag
5. Lifecycle
6. External Context

## 공통 탭 인터페이스
각 탭 API 응답은 되도록 아래 공통 구조를 따른다.

```ts
type AnalysisResponse = {
  projectId: number;
  analysisType:
    | "calendar"
    | "timetox"
    | "retention"
    | "velocity"
    | "lifecycle"
    | "context";
  status: "ok" | "partial" | "empty" | "error";
  requiredEvents?: string[];
  requiredProperties?: string[];
  metrics: Array<{ label: string; value: string | number; change?: string }>;
  charts: Array<{
    id: string;
    type: "line" | "bar" | "heatmap" | "table" | "area" | "scatter";
    title: string;
    data: any[];
  }>;
  insights: string[];
  warnings?: string[];
}
```

---

# 6. 분석별 구현 요구사항

## 6.1 Calendar Time 분석
- 목적: 시간대/요일/월초월말/시간 블록 기준 행동 패턴 시각화
- 차트: Hour of Day line, Day of Week bar, Day×Hour heatmap, Month phase 비교
- 데이터: App Open / Page View / Purchase 등 핵심 이벤트
- 구현: 서버에서 시간 bucket 및 month_phase / time_block 후처리

## 6.2 Event-relative Time (Time-to-X)
- 목적: 특정 행동까지 걸리는 시간 시각화
- 차트: signup→first action, view→cart→purchase lag, fast vs slow summary
- 구현: Mixpanel funnels query 기반, average/median/percentile 요약

## 6.3 Cohort & Retention Curve
- 목적: cohort별 유지율과 행동 차이 비교
- 차트: D1/D7/D30 KPI, retention curve, cohort table, channel/campaign breakdown
- 구현: Mixpanel retention query 사용

## 6.4 Velocity / Lag 분석
- 목적: 행동 빈도, 세션 간격, 퍼널 단계 간 지연 분석
- 차트: Events per User, Session interval, Funnel lag, fast vs slow 비교

## 6.5 Lifecycle Time
- 목적: 신규→활성→반복→휴면→이탈→복귀 상태 전환 관리
- 차트: lifecycle stage distribution, churn risk summary, reactivation trend
- 구현: recency/repeat rule로 서버에서 lifecycle state 파생

## 6.6 External Context
- 목적: 캠페인, 급여일, 공휴일, 릴리즈 등 맥락과 행동 변화 연결
- 차트: before/after, campaign window trend, payday flag, holiday comparison
- 구현: property flag 또는 lookup table 기반 비교

---

# 7. 화면 구성 요구사항

## 7.1 상단 헤더
- 제목: Time-based Mixpanel Analytics
- Mixpanel 인증 버튼
- 인증 상태 배지
- 프로젝트 선택 드롭다운
- 새로고침 버튼

## 7.2 메인 레이아웃
- 탭 네비게이션
- 본문 패널
- 각 탭은 lazy loading
- 프로젝트 변경 시 현재 탭 데이터 재호출

## 7.3 탭 내부 공통 UI
- KPI 카드 3~4개
- 메인 차트
- 보조 차트
- 핵심 인사이트 bullet 3개
- warnings / empty state

---

# 8. API 설계 예시

## 인증
`POST /api/mixpanel/auth`

## 프로젝트 리스트
`GET /api/mixpanel/projects`

## 분석 API
- `GET /api/mixpanel/analysis/calendar?projectId=12345`
- `GET /api/mixpanel/analysis/timetox?projectId=12345`
- `GET /api/mixpanel/analysis/retention?projectId=12345`
- `GET /api/mixpanel/analysis/velocity?projectId=12345`
- `GET /api/mixpanel/analysis/lifecycle?projectId=12345`
- `GET /api/mixpanel/analysis/context?projectId=12345`

---

# 9. Claude Code 구현 순서

## Phase 1. 기본 골격
1. Next.js app 생성
2. Tailwind 설정
3. 탭 UI와 헤더 UI 생성
4. 상태 관리 구조 생성

## Phase 2. Mixpanel 연동
1. `.env.example` 작성
2. 서버 인증 모듈 생성
3. 프로젝트 리스트 API 생성
4. 인증 버튼과 프로젝트 선택기 연결

## Phase 3. 분석 API 골격
1. 6개 분석 route 생성
2. 각 route는 mock 데이터부터 반환
3. 프론트엔드 탭과 연동

## Phase 4. 실제 Mixpanel 데이터 연결
1. schema 탐색 유틸 작성
2. event/property 자동 매핑
3. 각 분석별 query adapter 구현
4. 시각화 데이터 shape 맞추기

## Phase 5. 품질 개선
1. loading / error / empty states
2. rate-limit friendly batching
3. 캐싱
4. 사용자 정의 이벤트 선택 옵션

---

# 10. Claude Code에 바로 줄 실행 프롬프트

```md
Build a production-ready Next.js app that does the following:

1. Show a "Connect Mixpanel" button.
2. When clicked, call a server-side API route that validates Mixpanel credentials stored in environment variables.
3. After successful authentication, fetch and display the available Mixpanel project list.
4. When a project is selected, render 6 analysis tabs:
   - Calendar Time
   - Event-relative Time (Time-to-X)
   - Cohort & Retention Curve
   - Velocity / Lag
   - Lifecycle Time
   - External Context
5. Each tab should call its own server-side analysis endpoint and render charts plus KPI summaries.
6. Do not expose Mixpanel credentials in the browser.
7. Use TypeScript, Tailwind, and reusable chart components.
8. Add clear empty states if the project does not contain the required events or properties.
9. Start with mock responses, then wire real Mixpanel API calls.
```

---

# 11. 매핑 전략
- 이벤트명 하드코딩 최소화
- schema 조회 후 후보군 매핑
- 매핑 실패 시 수동 event picker 제공

후보 예시:
- signup: `Sign Up`, `Signup`, `User Signed Up`
- purchase: `Purchase`, `Order Completed`, `Checkout Completed`
- add_to_cart: `Add to Cart`, `Cart Added`
- session: `Session Start`, `App Open`, `Page View`

---

# 12. 캐싱/성능
- 프로젝트 리스트: 5~15분 캐시
- 분석 결과: query params 기준 캐시
- 탭별 lazy fetch
- 첫 탭만 eager load

---

# 13. 에러 처리
사용자 메시지 예시:
- “Mixpanel 인증에 실패했습니다. 서버 환경변수를 확인해 주세요.”
- “이 프로젝트에서 Purchase 이벤트를 찾지 못했습니다.”
- “이 분석을 계산하려면 Sign Up 이벤트가 필요합니다.”
- “현재 Mixpanel 응답 제한으로 인해 잠시 후 다시 시도해 주세요.”

---

# 14. 테스트 항목
- 인증 성공/실패
- 프로젝트 리스트 렌더
- 프로젝트 전환
- 탭 전환
- 각 분석 API 정상 응답
- 빈 상태 렌더

---

# 15. 최종 체크리스트
- [ ] Mixpanel 인증 버튼 동작
- [ ] 프로젝트 리스트 표시
- [ ] 프로젝트 선택 시 6개 탭 렌더
- [ ] 탭별 서버 API 연결
- [ ] KPI + 차트 + 인사이트 표시
- [ ] 보안 처리
- [ ] README 및 실행 가이드 작성
- [ ] CLAUDE.md / todo.md 최신화
