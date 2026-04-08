import { MixpanelClient } from "../mixpanel-client";
import type {
  AnalysisResponse,
  BarChartData,
  LineChartData,
} from "../../types";

// ── Lifecycle state labels ──
const LIFECYCLE_STATES = [
  "신규",
  "활성",
  "반복",
  "휴면",
  "이탈",
  "복귀",
] as const;

type LifecycleState = (typeof LIFECYCLE_STATES)[number];

// ── Per-user profile ──
interface UserProfile {
  distinctId: string;
  firstEventDate: Date;
  lastEventDate: Date;
  eventCount: number;
  eventDates: Date[];
}

// ── Helpers ──

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/** Return the Monday-based ISO week label, e.g. "2026-W14" */
function weekLabel(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Check if a user had a gap > gapDays between consecutive events */
function hadGapLongerThan(dates: Date[], gapDays: number): boolean {
  if (dates.length < 2) return false;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1], sorted[i]) > gapDays) {
      return true;
    }
  }
  return false;
}

function classifyUser(
  profile: UserProfile,
  referenceDate: Date
): LifecycleState {
  const recency = daysBetween(profile.lastEventDate, referenceDate);
  const tenure = daysBetween(profile.firstEventDate, referenceDate);

  // Reactivated: had a gap > 30 days but returned within last 7 days
  if (
    recency <= 7 &&
    hadGapLongerThan(profile.eventDates, 30)
  ) {
    return "복귀";
  }

  // New: tenure <= 7 days
  if (tenure <= 7) return "신규";

  // Active vs Repeat: recency <= 7 AND tenure > 7
  if (recency <= 7) {
    return profile.eventCount >= 5 ? "반복" : "활성";
  }

  // Dormant: 7 < recency <= 30
  if (recency <= 30) return "휴면";

  // Churned: recency > 30
  return "이탈";
}

/** Generate an ordered list of ISO week labels between two dates */
function generateWeekLabels(from: Date, to: Date): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= to) {
    const wl = weekLabel(cursor);
    if (!seen.has(wl)) {
      seen.add(wl);
      labels.push(wl);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  // Ensure the last week is included
  const lastWl = weekLabel(to);
  if (!seen.has(lastWl)) labels.push(lastWl);

  return labels;
}

interface RawEvent {
  event: string;
  properties: { distinct_id: string; time: number; [key: string]: any };
}

function parseEvents(raw: any[]): RawEvent[] {
  return raw.filter(
    (e) =>
      e &&
      e.properties &&
      typeof e.properties.time === "number" &&
      typeof e.properties.distinct_id === "string"
  ) as RawEvent[];
}

function emptyResponse(
  projectId: number,
  message: string
): AnalysisResponse {
  return {
    projectId,
    analysisType: "lifecycle",
    status: "empty",
    requiredEvents: [message],
    metrics: [],
    charts: [],
    insights: [],
    warnings: ["데이터가 없습니다. 이벤트 이름과 날짜 범위를 확인하세요."],
  };
}

// ── Main ──

export async function analyzeLifecycle(
  client: MixpanelClient,
  projectId: number,
  events: { signup: string; activity: string },
  fromDate: string,
  toDate: string
): Promise<AnalysisResponse> {
  // ── 1. Export raw events ──
  let rawEvents: any[];
  try {
    rawEvents = await client.exportEvents(
      projectId,
      fromDate,
      toDate,
      events.activity,
      50000
    );
  } catch {
    return emptyResponse(
      projectId,
      `Activity 이벤트(${events.activity})를 가져오는 데 실패했습니다.`
    );
  }

  const parsed = parseEvents(rawEvents);
  if (parsed.length === 0) {
    return emptyResponse(
      projectId,
      `이벤트(${events.activity})에 대한 데이터가 없습니다.`
    );
  }

  // ── 2. Reference date ──
  const referenceDate = new Date(toDate + "T23:59:59Z");
  const periodStart = new Date(fromDate + "T00:00:00Z");

  // ── 3. Build user profiles ──
  const userMap = new Map<string, UserProfile>();

  for (const ev of parsed) {
    const uid = ev.properties.distinct_id;
    const eventDate = new Date(ev.properties.time * 1000);
    const existing = userMap.get(uid);

    if (!existing) {
      userMap.set(uid, {
        distinctId: uid,
        firstEventDate: eventDate,
        lastEventDate: eventDate,
        eventCount: 1,
        eventDates: [eventDate],
      });
    } else {
      existing.eventCount++;
      existing.eventDates.push(eventDate);
      if (eventDate < existing.firstEventDate) {
        existing.firstEventDate = eventDate;
      }
      if (eventDate > existing.lastEventDate) {
        existing.lastEventDate = eventDate;
      }
    }
  }

  const users = Array.from(userMap.values());
  const totalUsers = users.length;

  // ── 4. Classify each user ──
  const stateCounts: Record<LifecycleState, number> = {
    신규: 0,
    활성: 0,
    반복: 0,
    휴면: 0,
    이탈: 0,
    복귀: 0,
  };

  const userStates = new Map<string, LifecycleState>();

  for (const user of users) {
    const state = classifyUser(user, referenceDate);
    stateCounts[state]++;
    userStates.set(user.distinctId, state);
  }

  // ── 5. Build lifecycle distribution chart ──
  const lifecycleDistribution: BarChartData = LIFECYCLE_STATES.map(
    (state) => ({
      label: state,
      value: stateCounts[state],
    })
  );

  // ── 6. Build weekly churn & reactivation trends ──
  const weekLabels = generateWeekLabels(periodStart, referenceDate);
  const churnByWeek: Record<string, number> = {};
  const reactivationByWeek: Record<string, number> = {};
  for (const wl of weekLabels) {
    churnByWeek[wl] = 0;
    reactivationByWeek[wl] = 0;
  }

  // For churn trend: count users whose last event falls in each week
  // and who are classified as churned
  for (const user of users) {
    const state = userStates.get(user.distinctId)!;
    const lastWeek = weekLabel(user.lastEventDate);

    if (state === "이탈" && churnByWeek[lastWeek] !== undefined) {
      churnByWeek[lastWeek]++;
    }
    if (state === "복귀" && reactivationByWeek[lastWeek] !== undefined) {
      reactivationByWeek[lastWeek]++;
    }
  }

  const churnTrend: LineChartData = weekLabels.map((wl) => ({
    x: wl,
    churn: churnByWeek[wl] ?? 0,
  }));

  const reactivationTrend: LineChartData = weekLabels.map((wl) => ({
    x: wl,
    reactivation: reactivationByWeek[wl] ?? 0,
  }));

  // ── 7. Metrics ──
  const activeCount = stateCounts["활성"] + stateCounts["반복"];
  const dormantCount = stateCounts["휴면"];
  const churnedCount = stateCounts["이탈"];
  const reactivatedCount = stateCounts["복귀"];

  const activeRate =
    totalUsers > 0
      ? ((activeCount / totalUsers) * 100).toFixed(1) + "%"
      : "0%";
  const dormantRate =
    totalUsers > 0
      ? ((dormantCount / totalUsers) * 100).toFixed(1) + "%"
      : "0%";
  const churnRate =
    totalUsers > 0
      ? ((churnedCount / totalUsers) * 100).toFixed(1) + "%"
      : "0%";
  const reactivationRate =
    churnedCount + reactivatedCount > 0
      ? (
          (reactivatedCount / (churnedCount + reactivatedCount)) *
          100
        ).toFixed(1) + "%"
      : "0%";

  // ── 8. Insights ──
  const insights: string[] = [];

  if (totalUsers > 0) {
    insights.push(
      `전체 ${totalUsers}명의 유저 중 활성(활성+반복) 유저는 ${activeCount}명(${activeRate})입니다.`
    );
  }

  if (churnedCount > dormantCount && churnedCount > 0) {
    insights.push(
      `이탈 유저(${churnedCount}명)가 휴면 유저(${dormantCount}명)보다 많습니다. 리텐션 전략이 필요합니다.`
    );
  }

  if (reactivatedCount > 0) {
    insights.push(
      `복귀 유저 ${reactivatedCount}명 — 30일 이상 비활성 후 최근 7일 내 복귀한 유저입니다.`
    );
  }

  if (stateCounts["반복"] > stateCounts["활성"]) {
    insights.push(
      `반복 유저(${stateCounts["반복"]}명)가 일반 활성 유저(${stateCounts["활성"]}명)보다 많아 코어 유저층이 탄탄합니다.`
    );
  }

  if (dormantCount > activeCount && totalUsers > 0) {
    insights.push(
      `휴면 유저 비율(${dormantRate})이 활성 유저 비율(${activeRate})보다 높습니다. 7일 내 CRM 개입을 권장합니다.`
    );
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push("분석 기간 내 라이프사이클 상태 분포를 확인하세요.");
  }

  // ── 9. Return ──
  return {
    projectId,
    analysisType: "lifecycle",
    status: "ok",
    metrics: [
      { label: "활성 유저 비율", value: activeRate },
      { label: "휴면 유저 비율", value: dormantRate },
      { label: "Churn Rate", value: churnRate },
      { label: "복귀율", value: reactivationRate },
    ],
    charts: [
      {
        id: "lifecycleDistribution",
        type: "bar",
        title: "Lifecycle 상태 분포",
        data: lifecycleDistribution,
      },
      {
        id: "churnTrend",
        type: "line",
        title: "Churn 위험 추이",
        data: churnTrend,
      },
      {
        id: "reactivation",
        type: "line",
        title: "복귀(Reactivation) 트렌드",
        data: reactivationTrend,
      },
    ],
    insights,
  };
}
