import type { MixpanelClient } from "../mixpanel-client";
import type { AnalysisResponse, LineChartData, TableChartData } from "../../types";

// ── Helpers ──

/** Return "YYYY-MM-DD" from a Unix timestamp (seconds). */
function tsToDateStr(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

/** Day-difference between two "YYYY-MM-DD" strings. */
function dayDiff(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

/** ISO-week label, e.g. "3월 2주" */
function weekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1; // 1-based
  // week-of-month: ceil(day / 7)
  const week = Math.ceil(d.getDate() / 7);
  return `${month}월 ${week}주`;
}

// ── Types used internally ──

interface RawEvent {
  event: string;
  properties: Record<string, any>;
}

interface UserCohortInfo {
  cohortDate: string;
  returnDays: Set<number>;
  channel: string;
}

// ── Main ──

export async function analyzeRetention(
  client: MixpanelClient,
  projectId: number,
  events: { cohortEvent: string; retentionEvent: string },
  fromDate: string,
  toDate: string
): Promise<AnalysisResponse> {
  // 1. Export raw events -------------------------------------------------
  let cohortRaw: RawEvent[];
  let retentionRaw: RawEvent[];

  try {
    [cohortRaw, retentionRaw] = await Promise.all([
      client.exportEvents(projectId, fromDate, toDate, events.cohortEvent, 50000),
      client.exportEvents(projectId, fromDate, toDate, events.retentionEvent, 50000),
    ]);
  } catch {
    return emptyResponse(projectId);
  }

  if (!cohortRaw.length || !retentionRaw.length) {
    return emptyResponse(projectId);
  }

  // 2. Build per-user cohort info ----------------------------------------
  const users = new Map<string, UserCohortInfo>();

  for (const evt of cohortRaw) {
    const uid: string | undefined = evt.properties?.distinct_id;
    if (!uid) continue;
    const ts: number | undefined = evt.properties?.time;
    if (!ts) continue;
    const dateStr = tsToDateStr(ts);
    const existing = users.get(uid);
    if (!existing || dateStr < existing.cohortDate) {
      const channel =
        evt.properties?.platform ??
        evt.properties?.utm_source ??
        "전체";
      users.set(uid, {
        cohortDate: dateStr,
        returnDays: new Set<number>(),
        channel: String(channel),
      });
    }
  }

  // Track retention events
  for (const evt of retentionRaw) {
    const uid: string | undefined = evt.properties?.distinct_id;
    if (!uid) continue;
    const ts: number | undefined = evt.properties?.time;
    if (!ts) continue;
    const info = users.get(uid);
    if (!info) continue;
    const dateStr = tsToDateStr(ts);
    const diff = dayDiff(info.cohortDate, dateStr);
    if (diff >= 0 && diff <= 30) {
      info.returnDays.add(diff);
    }
  }

  const totalUsers = users.size;
  if (totalUsers === 0) {
    return emptyResponse(projectId);
  }

  // 3. Compute retention rates -------------------------------------------
  const retentionByDay: number[] = new Array(31).fill(0);

  for (const info of users.values()) {
    for (let d = 0; d <= 30; d++) {
      if (info.returnDays.has(d)) retentionByDay[d]++;
    }
  }

  const retentionPct = retentionByDay.map((c) =>
    Math.round((c / totalUsers) * 10000) / 100
  );

  // 4a. Retention curve --------------------------------------------------
  const retentionCurve: LineChartData = retentionPct.map((pct, i) => ({
    x: `D${i}`,
    retention: pct,
  }));

  // 4b. Cohort table -----------------------------------------------------
  // Group users by cohort week
  const weekBuckets = new Map<string, { total: number; dayCounters: number[] }>();

  for (const info of users.values()) {
    const wk = weekLabel(info.cohortDate);
    let bucket = weekBuckets.get(wk);
    if (!bucket) {
      bucket = { total: 0, dayCounters: new Array(31).fill(0) };
      weekBuckets.set(wk, bucket);
    }
    bucket.total++;
    for (let d = 0; d <= 30; d++) {
      if (info.returnDays.has(d)) bucket.dayCounters[d]++;
    }
  }

  const milestones = [1, 7, 14, 21, 30] as const;
  const cohortTable: TableChartData = {
    columns: ["코호트", "D1", "D7", "D14", "D21", "D30"],
    rows: [...weekBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, b]) => [
        wk,
        ...milestones.map((d) =>
          b.total > 0 ? Math.round((b.dayCounters[d] / b.total) * 100) : 0
        ),
      ]),
  };

  // 4c. Channel retention ------------------------------------------------
  const channelMap = new Map<string, { total: number; dayCounters: number[] }>();

  for (const info of users.values()) {
    const ch = info.channel;
    let bucket = channelMap.get(ch);
    if (!bucket) {
      bucket = { total: 0, dayCounters: new Array(31).fill(0) };
      channelMap.set(ch, bucket);
    }
    bucket.total++;
    for (let d = 0; d <= 30; d++) {
      if (info.returnDays.has(d)) bucket.dayCounters[d]++;
    }
  }

  const channelNames = [...channelMap.keys()].sort();
  const channelRetention = Array.from({ length: 31 }, (_, d) => {
    const point: Record<string, number | string> = { x: `D${d}` };
    for (const ch of channelNames) {
      const b = channelMap.get(ch)!;
      point[ch] = b.total > 0 ? Math.round((b.dayCounters[d] / b.total) * 100) : 0;
    }
    return point;
  }) as LineChartData;

  // 5. Metrics -----------------------------------------------------------
  const d1 = retentionPct[1] ?? 0;
  const d7 = retentionPct[7] ?? 0;
  const d30 = retentionPct[30] ?? 0;

  const plateau = findPlateau(retentionPct);

  // 6. Insights ----------------------------------------------------------
  const insights: string[] = [
    `D1 리텐션은 ${d1}%이며, D7에서 ${d7}%로 감소합니다.`,
    `리텐션이 D${plateau}에서 안정화됩니다.`,
  ];

  return {
    projectId,
    analysisType: "retention",
    status: "ok",
    metrics: [
      { label: "D1 리텐션", value: `${d1}%` },
      { label: "D7 리텐션", value: `${d7}%` },
      { label: "D30 리텐션", value: `${d30}%` },
      { label: "Plateau 시점", value: `D${plateau}` },
    ],
    charts: [
      { id: "retentionCurve", type: "line", title: "리텐션 커브", data: retentionCurve },
      { id: "cohortTable", type: "table", title: "코호트 테이블", data: cohortTable },
      { id: "channelRetention", type: "line", title: "채널별 리텐션 비교", data: channelRetention },
    ],
    insights,
  };
}

// ── Helpers ──

/** Find first day where retention change < 1% for 3 consecutive days. */
function findPlateau(pct: number[]): number {
  for (let i = 1; i <= 28; i++) {
    const a = Math.abs(pct[i] - pct[i - 1]);
    const b = Math.abs(pct[i + 1] - pct[i]);
    const c = Math.abs(pct[i + 2] - pct[i + 1]);
    if (a < 1 && b < 1 && c < 1) return i;
  }
  // Fallback: no clear plateau detected
  return 30;
}

function emptyResponse(projectId: number): AnalysisResponse {
  return {
    projectId,
    analysisType: "retention",
    status: "empty",
    metrics: [],
    charts: [],
    insights: [],
    warnings: ["분석할 이벤트 데이터가 충분하지 않습니다."],
  };
}
