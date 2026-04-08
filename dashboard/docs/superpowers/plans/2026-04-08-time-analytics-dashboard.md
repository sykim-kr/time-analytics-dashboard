# Time-based Mixpanel Analytics Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page dark-theme dashboard that authenticates with Mixpanel OAuth, lists projects, and renders 6 analysis tabs with configurable event selectors, KPI cards, charts, and insights — all powered by mock data initially.

**Architecture:** Next.js App Router single-page app. Server-side API routes proxy all Mixpanel calls (tokens stored in httpOnly cookies). Client uses React Context for auth state, TanStack Query for data fetching, Recharts for charts. Each tab has an EventSelector bar to choose which Mixpanel events drive the analysis.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Recharts, TanStack Query, zod

**Spec:** `docs/superpowers/specs/2026-04-08-time-analytics-dashboard-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `.env.example`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "C:/Users/ottug/Downloads/11_개발_테스트/time analytics framework/dashboard"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This creates the full Next.js scaffold.

- [ ] **Step 2: Install dependencies**

```bash
npm install recharts @tanstack/react-query zod
npm install -D @types/node
```

- [ ] **Step 3: Configure dark theme in globals.css**

Replace `app/globals.css` with Tailwind base + dark body defaults:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-950 text-slate-200 antialiased;
}
```

- [ ] **Step 4: Update layout.tsx for Korean + dark theme**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시간 기반 분석 | Mixpanel Analytics",
  description: "시간 기반 분석 프레임워크 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create .env.example**

```
MIXPANEL_CLIENT_ID=
MIXPANEL_CLIENT_SECRET=
MIXPANEL_REDIRECT_URI=http://localhost:3000/api/mixpanel/callback
COOKIE_SECRET=
USE_MOCK=true
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Open http://localhost:3000 — should see dark background.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind dark theme"
```

---

## Task 2: Shared Types

**Files:**
- Create: `lib/types.ts`

All shared TypeScript types from the spec: chart data unions, AnalysisResponse, ApiErrorResponse, EventSlot, SchemaResponse, auth states.

- [ ] **Step 1: Create lib/types.ts with all shared types**

```ts
// lib/types.ts

// --- Auth ---
export type AuthState =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "loading_projects"
  | "project_selected"
  | "loading_analysis"
  | "ready"
  | "error";

export type MixpanelProject = {
  id: number;
  name: string;
};

// --- Chart Data Types ---
export type LineChartData = { x: string; [series: string]: number | string }[];
export type BarChartData = { label: string; value: number; group?: string }[];
export type HeatmapChartData = { x: string; y: string; value: number }[];
export type TableChartData = { columns: string[]; rows: (string | number)[][] };
export type AreaChartData = { x: string; [series: string]: number | string }[];
export type ScatterChartData = { x: number; y: number; label?: string }[];

export type ChartConfig =
  | { id: string; type: "line"; title: string; data: LineChartData }
  | { id: string; type: "bar"; title: string; data: BarChartData }
  | { id: string; type: "heatmap"; title: string; data: HeatmapChartData }
  | { id: string; type: "table"; title: string; data: TableChartData }
  | { id: string; type: "area"; title: string; data: AreaChartData }
  | { id: string; type: "scatter"; title: string; data: ScatterChartData };

export type AnalysisType = "calendar" | "timetox" | "retention" | "velocity" | "lifecycle" | "context";

export type AnalysisResponse = {
  projectId: number;
  analysisType: AnalysisType;
  status: "ok" | "partial" | "empty" | "error";
  requiredEvents?: string[];
  requiredProperties?: string[];
  metrics: Array<{ label: string; value: string | number; change?: string }>;
  charts: ChartConfig[];
  insights: string[];
  warnings?: string[];
};

export type ApiErrorResponse = {
  error: string;
  code: "auth_expired" | "invalid_params" | "upstream_error" | "rate_limited" | "not_found";
  details?: string;
};

// --- Event Selector ---
export type EventSlot = {
  key: string;
  label: string;
  defaultCandidates: string[];
  required: boolean;
  value?: string;
};

// --- Schema ---
export type SchemaResponse = {
  events: Array<{
    name: string;
    properties: Array<{ name: string; type: string }>;
  }>;
  userProperties: Array<{ name: string; type: string }>;
};

// --- Tab Config ---
export type TabConfig = {
  id: AnalysisType;
  label: string;
  icon: string;
  eventSlots: EventSlot[];
  eventSelectorVariant?: "default" | "funnel";
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Mock Data (6 files)

**Files:**
- Create: `lib/mock/calendar.ts`
- Create: `lib/mock/timetox.ts`
- Create: `lib/mock/retention.ts`
- Create: `lib/mock/velocity.ts`
- Create: `lib/mock/lifecycle.ts`
- Create: `lib/mock/context.ts`

Each file exports a function `getMockData(projectId: number): AnalysisResponse` returning realistic Korean-labeled mock data with the correct chart types from the spec.

- [ ] **Step 1: Create lib/mock/calendar.ts**

Mock data for Calendar Time tab: hourly bar chart (0-23h), day×hour heatmap, month phase comparison bar chart. 4 KPI metrics, 3 insights. Status "ok".

- [ ] **Step 2: Create lib/mock/timetox.ts**

Mock data for Time-to-X tab: time distribution histogram, funnel lag bar chart, fast vs slow comparison. 4 KPIs, 3 insights.

- [ ] **Step 3: Create lib/mock/retention.ts**

Mock data for Retention tab: retention curve line (D0-D30), cohort table, channel comparison multi-line. 4 KPIs, 3 insights.

- [ ] **Step 4: Create lib/mock/velocity.ts**

Mock data for Velocity/Lag tab: event frequency distribution, session interval line, fast vs slow bar. 4 KPIs, 3 insights.

- [ ] **Step 5: Create lib/mock/lifecycle.ts**

Mock data for Lifecycle tab: lifecycle state stacked bar, churn trend line, reactivation trend line. 4 KPIs, 3 insights.

- [ ] **Step 6: Create lib/mock/context.ts**

Mock data for External Context tab: campaign before/after area chart, payday bar, holiday comparison bar. 4 KPIs, 3 insights.

- [ ] **Step 7: Commit**

```bash
git add lib/mock/
git commit -m "feat: add mock data for all 6 analysis tabs"
```

---

## Task 4: API Routes — Analysis (6 routes + schema)

**Files:**
- Create: `app/api/mixpanel/analysis/calendar/route.ts`
- Create: `app/api/mixpanel/analysis/timetox/route.ts`
- Create: `app/api/mixpanel/analysis/retention/route.ts`
- Create: `app/api/mixpanel/analysis/velocity/route.ts`
- Create: `app/api/mixpanel/analysis/lifecycle/route.ts`
- Create: `app/api/mixpanel/analysis/context/route.ts`
- Create: `app/api/mixpanel/schema/route.ts`

Each route validates `projectId` with zod, returns mock data for now. Schema route returns a mock event list.

- [ ] **Step 1: Create shared validation util**

Create `lib/mixpanel/validation.ts` with zod schemas for common query params:

```ts
import { z } from "zod";

export const analysisQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
  from: z.string().optional(),
  to: z.string().optional(),
});
```

- [ ] **Step 2: Create calendar analysis route**

`app/api/mixpanel/analysis/calendar/route.ts` — GET handler that parses query params with zod, imports mock data, returns `AnalysisResponse` JSON. Pass through `events.*` query params for event selection.

- [ ] **Step 3: Create remaining 5 analysis routes**

Same pattern for timetox, retention, velocity, lifecycle, context. Each imports its own mock module.

- [ ] **Step 4: Create schema route**

`app/api/mixpanel/schema/route.ts` — returns mock `SchemaResponse` with common event names: `App Open`, `Page View`, `Sign Up`, `Purchase`, `Add to Cart`, `Session Start`, `Search`, `Content View`.

- [ ] **Step 5: Verify routes respond**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/mixpanel/schema?projectId=1
curl http://localhost:3000/api/mixpanel/analysis/calendar?projectId=1
```

Expected: JSON responses with mock data.

- [ ] **Step 6: Commit**

```bash
git add app/api/ lib/mixpanel/
git commit -m "feat: add analysis API routes with mock data"
```

---

## Task 5: API Routes — Auth (OAuth mock)

**Files:**
- Create: `app/api/mixpanel/auth/route.ts`
- Create: `app/api/mixpanel/callback/route.ts`
- Create: `app/api/mixpanel/logout/route.ts`
- Create: `app/api/mixpanel/projects/route.ts`
- Create: `lib/mixpanel/auth.ts`

For the mock phase, auth route sets a mock token cookie directly (skipping real OAuth redirect). Projects route returns mock project list.

- [ ] **Step 1: Create lib/mixpanel/auth.ts**

Token cookie helpers: `setTokenCookie(response, token)`, `getTokenFromCookies(request)`, `clearTokenCookie(response)`. Cookie name: `mp_token`. Settings: httpOnly, secure in production, sameSite lax, path /.

- [ ] **Step 2: Create auth route (mock mode)**

`app/api/mixpanel/auth/route.ts` — In mock mode (`USE_MOCK=true`): sets a mock token cookie and redirects to `/?authenticated=true`. In real mode: generates state, stores in cookie, redirects to Mixpanel OAuth URL.

- [ ] **Step 3: Create callback route (mock mode)**

`app/api/mixpanel/callback/route.ts` — In mock mode: no-op redirect to `/`. In real mode: validates state, exchanges code for token, sets cookie.

- [ ] **Step 4: Create logout route**

`app/api/mixpanel/logout/route.ts` — POST handler. Clears token cookie. Returns `{ success: true }`.

- [ ] **Step 5: Create projects route**

`app/api/mixpanel/projects/route.ts` — GET handler. Checks for token cookie. Returns mock project list: `[{ id: 1, name: "My App Production" }, { id: 2, name: "Staging" }, { id: 3, name: "Marketing Site" }]`.

- [ ] **Step 6: Commit**

```bash
git add app/api/mixpanel/ lib/mixpanel/
git commit -m "feat: add auth, projects, and logout API routes"
```

---

## Task 6: Auth Context & Provider

**Files:**
- Create: `contexts/MixpanelAuthContext.tsx`

React Context managing `AuthState`, selected project, available projects. Provides `connect()`, `logout()`, `selectProject()` actions.

- [ ] **Step 1: Create MixpanelAuthContext.tsx**

Context with:
- State: `authState: AuthState`, `projects: MixpanelProject[]`, `selectedProject: MixpanelProject | null`, `error: string | null`
- Actions: `connect()` → calls `/api/mixpanel/auth`, `logout()` → calls `/api/mixpanel/logout`, `selectProject(project)` → sets selected project
- On mount: check if token cookie exists by calling `/api/mixpanel/projects` — if it returns data, set state to `authenticated` + load projects
- Wrap children in `QueryClientProvider` from TanStack Query

- [ ] **Step 2: Commit**

```bash
git add contexts/
git commit -m "feat: add MixpanelAuthContext with auth state management"
```

---

## Task 7: Dashboard UI Shell Components

**Files:**
- Create: `components/auth/ConnectMixpanelButton.tsx`
- Create: `components/auth/ProjectSelector.tsx`
- Create: `components/dashboard/DashboardHeader.tsx`
- Create: `components/dashboard/AnalysisTabs.tsx`
- Create: `components/dashboard/LoadingSkeleton.tsx`
- Create: `components/dashboard/EmptyState.tsx`
- Create: `components/dashboard/WarningBanner.tsx`
- Create: `components/dashboard/KpiCards.tsx`
- Create: `components/dashboard/InsightList.tsx`
- Create: `components/dashboard/TabContent.tsx`

- [ ] **Step 1: Create ConnectMixpanelButton.tsx**

Button component. Shows "Mixpanel 인증하기" in idle state, spinner in authenticating, "✓ 연결됨" badge when authenticated. Uses `useMixpanelAuth()` context hook.

- [ ] **Step 2: Create ProjectSelector.tsx**

Dropdown select component. Shows loading spinner during `loading_projects`. Lists available projects. Calls `selectProject()` on change.

- [ ] **Step 3: Create DashboardHeader.tsx**

Horizontal header bar. Contains app title "⏱ 시간 기반 분석", ConnectMixpanelButton, ProjectSelector, refresh button. Dark bg `bg-slate-800`.

- [ ] **Step 4: Create KpiCards.tsx**

Renders array of `{ label, value, change }` as a 4-column grid of cards. Shows label, large value, colored change indicator (green ▲ / red ▼). Accepts optional `eventLabel` per card to show which event it references.

- [ ] **Step 5: Create InsightList.tsx**

Renders `string[]` insights as bullet list with purple dot indicators.

- [ ] **Step 6: Create LoadingSkeleton.tsx**

Shimmer skeleton: 4 KPI card placeholders + 2 chart area placeholders + insight placeholder. Uses Tailwind animate-pulse.

- [ ] **Step 7: Create EmptyState.tsx**

Shows icon, message, and list of required events. Props: `message: string`, `requiredEvents?: string[]`.

- [ ] **Step 8: Create WarningBanner.tsx**

Yellow/amber banner at top of tab content. Shows warning icon + message. Props: `warnings: string[]`.

- [ ] **Step 9: Create TabContent.tsx**

Wrapper component. Accepts `status`, `children`, `requiredEvents`, `warnings`. Renders LoadingSkeleton for loading, EmptyState for empty, WarningBanner + children for partial, children for ok, error message for error.

- [ ] **Step 10: Create AnalysisTabs.tsx**

Horizontal tab navigation. 6 tabs with icons and labels from spec. Manages active tab state. Renders active tab component below. Uses `React.lazy` + `Suspense` for lazy loading tab components.

- [ ] **Step 11: Commit**

```bash
git add components/
git commit -m "feat: add dashboard shell UI components"
```

---

## Task 8: Event Selector Component

**Files:**
- Create: `components/dashboard/EventSelector.tsx`

- [ ] **Step 1: Create EventSelector.tsx**

Two variants:
- `default`: horizontal row of labeled dropdowns (label: select) + "적용" button
- `funnel`: step indicators (1→2→3) with dropdowns + "+ 단계 추가" button + "적용" button

Props: `EventSelectorProps` from types. Each dropdown populated from `availableEvents`. Shows auto-mapped status indicator. Calls `onChange` with `Record<string, string>` on "적용" click.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/EventSelector.tsx
git commit -m "feat: add EventSelector component with default and funnel variants"
```

---

## Task 9: Chart Components (7 charts)

**Files:**
- Create: `components/charts/TimeSeriesChart.tsx`
- Create: `components/charts/HeatmapChart.tsx`
- Create: `components/charts/RetentionCurveChart.tsx`
- Create: `components/charts/FunnelLagChart.tsx`
- Create: `components/charts/ComparisonBarChart.tsx`
- Create: `components/charts/DistributionChart.tsx`
- Create: `components/charts/CohortTable.tsx`

All chart components are `"use client"` and receive typed data props. They render Recharts components (except HeatmapChart which uses CSS grid).

- [ ] **Step 1: Create TimeSeriesChart.tsx**

Recharts `BarChart` or `LineChart` based on prop. X-axis labels, Y-axis values. Responsive container. Dark theme colors (indigo/purple palette). Shows `eventLabel` subtitle. Props: `data: BarChartData | LineChartData`, `chartType: "bar" | "line"`, `title: string`, `eventLabel?: string`.

- [ ] **Step 2: Create HeatmapChart.tsx**

CSS grid-based heatmap (Recharts has no native heatmap). Renders grid cells with background color intensity based on value. X-axis: time slots, Y-axis: day names. Color scale: slate-900 (low) → purple-500 (high). Props: `data: HeatmapChartData`, `title: string`, `xLabels: string[]`, `yLabels: string[]`.

- [ ] **Step 3: Create ComparisonBarChart.tsx**

Recharts grouped/stacked `BarChart`. Used for month-phase comparison, fast vs slow, payday, holiday comparisons. Props: `data: BarChartData`, `title: string`, `eventLabel?: string`.

- [ ] **Step 4: Create DistributionChart.tsx**

Recharts `BarChart` styled as histogram. Used for time distribution in Time-to-X. Props: `data: BarChartData`, `title: string`.

- [ ] **Step 5: Create RetentionCurveChart.tsx**

Recharts `LineChart` with D0-D30 x-axis, percentage y-axis. Multiple series for different cohorts/channels. Area fill optional. Props: `data: LineChartData`, `title: string`.

- [ ] **Step 6: Create FunnelLagChart.tsx**

Horizontal Recharts `BarChart` showing time between funnel steps. Step labels on Y-axis, time on X-axis. Props: `data: BarChartData`, `title: string`, `steps: string[]`.

- [ ] **Step 7: Create CohortTable.tsx**

HTML table styled with Tailwind. Rows = cohort weeks, columns = D1/D7/D14/D21/D30. Cell color intensity based on retention value. Props: `data: TableChartData`, `title: string`.

- [ ] **Step 8: Commit**

```bash
git add components/charts/
git commit -m "feat: add 7 reusable chart components"
```

---

## Task 10: Tab Components (6 tabs)

**Files:**
- Create: `components/tabs/CalendarTab.tsx`
- Create: `components/tabs/TimeToXTab.tsx`
- Create: `components/tabs/RetentionTab.tsx`
- Create: `components/tabs/VelocityTab.tsx`
- Create: `components/tabs/LifecycleTab.tsx`
- Create: `components/tabs/ContextTab.tsx`

Each tab component:
1. Defines its `EventSlot[]` configuration
2. Manages selected events state
3. Calls its analysis API via `useQuery` (TanStack Query) with projectId + selected events
4. Renders: EventSelector → TabContent wrapper → KpiCards + Charts + InsightList

- [ ] **Step 1: Create CalendarTab.tsx**

Event slots: primary(App Open), conversion(Purchase), browse(Page View).
Charts: TimeSeriesChart (hourly bar), HeatmapChart (day×hour), ComparisonBarChart (month phase).
Fetches from `/api/mixpanel/analysis/calendar`.

- [ ] **Step 2: Create TimeToXTab.tsx**

Event slots (funnel variant): funnel steps [Sign Up, Add to Cart, Purchase].
Charts: DistributionChart (time distribution), FunnelLagChart (step lag), ComparisonBarChart (fast vs slow).
Fetches from `/api/mixpanel/analysis/timetox`.

- [ ] **Step 3: Create RetentionTab.tsx**

Event slots: cohort(Sign Up), return(App Open).
Charts: RetentionCurveChart (D0-D30), CohortTable, RetentionCurveChart (channel comparison).
Fetches from `/api/mixpanel/analysis/retention`.

- [ ] **Step 4: Create VelocityTab.tsx**

Event slots: frequency(Any Event), session(Session Start), conversion(Purchase).
Charts: ComparisonBarChart (frequency distribution), TimeSeriesChart (session interval line), ComparisonBarChart (fast vs slow).
Fetches from `/api/mixpanel/analysis/velocity`.

- [ ] **Step 5: Create LifecycleTab.tsx**

Event slots: signup(Sign Up), active(App Open).
Charts: ComparisonBarChart (lifecycle distribution stacked), TimeSeriesChart (churn trend line), TimeSeriesChart (reactivation line).
Fetches from `/api/mixpanel/analysis/lifecycle`.

- [ ] **Step 6: Create ContextTab.tsx**

Event slots: target(Purchase), contextProp(campaign).
Charts: TimeSeriesChart (campaign before/after area), ComparisonBarChart (payday), ComparisonBarChart (holiday).
Fetches from `/api/mixpanel/analysis/context`.

- [ ] **Step 7: Commit**

```bash
git add components/tabs/
git commit -m "feat: add 6 analysis tab components with event selectors"
```

---

## Task 11: Main Page Assembly

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Create page.tsx**

```tsx
"use client";

import { MixpanelAuthProvider } from "@/contexts/MixpanelAuthContext";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisTabs } from "@/components/dashboard/AnalysisTabs";

export default function Home() {
  return (
    <MixpanelAuthProvider>
      <div className="min-h-screen bg-slate-950">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-6 py-6">
          <AnalysisTabs />
        </main>
      </div>
    </MixpanelAuthProvider>
  );
}
```

- [ ] **Step 2: Verify full flow**

```bash
npm run dev
```

1. Open http://localhost:3000
2. See header with "Mixpanel 인증하기" button
3. Click button → redirects to auth API → mock token set → redirects back
4. Project dropdown loads with mock projects
5. Select project → 6 tabs appear
6. Click each tab → KPI cards, charts, insights render with mock data
7. Change events in EventSelector → click "적용" → data refreshes

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble main dashboard page"
```

---

## Task 12: Polish & README

**Files:**
- Modify: `app/globals.css` (scrollbar styling, transitions)
- Create: `README.md`

- [ ] **Step 1: Add transition and scrollbar styles**

Add smooth tab transitions, custom scrollbar for dark theme, hover states.

- [ ] **Step 2: Write README.md**

Setup instructions:
1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `USE_MOCK=true` for development
4. `npm run dev`
5. Open http://localhost:3000

Document: project structure overview, tech stack, mock vs real mode, how to add real Mixpanel OAuth credentials.

- [ ] **Step 3: Update todo.md**

Mark completed phases, note open issues (real Mixpanel API integration pending), assumptions.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "docs: add README and polish styles"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project scaffolding | 6 |
| 2 | Shared types | 1 |
| 3 | Mock data (6 tabs) | 6 |
| 4 | Analysis API routes + schema | 8 |
| 5 | Auth API routes | 5 |
| 6 | Auth context | 1 |
| 7 | Dashboard UI shell | 11 |
| 8 | Event selector | 1 |
| 9 | Chart components | 7 |
| 10 | Tab components | 6 |
| 11 | Main page assembly | 1 |
| 12 | Polish & README | 3 |
| **Total** | | **~56 files** |
