import { MixpanelClient } from "../mixpanel-client";
import type {
  AnalysisResponse,
  BarChartData,
  HeatmapChartData,
} from "../../types";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;
const DISPLAY_DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;
const HOUR_BUCKETS = [
  "0-3",
  "3-6",
  "6-9",
  "9-12",
  "12-15",
  "15-18",
  "18-21",
  "21-24",
] as const;

type HourBucket = (typeof HOUR_BUCKETS)[number];

function getHourBucket(hour: number): HourBucket {
  const idx = Math.min(Math.floor(hour / 3), 7);
  return HOUR_BUCKETS[idx];
}

function getMonthPhase(dayOfMonth: number): "월초" | "월중" | "월말" {
  if (dayOfMonth <= 10) return "월초";
  if (dayOfMonth <= 20) return "월중";
  return "월말";
}

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

interface RawEvent {
  event: string;
  properties: { time: number; [key: string]: any };
}

function parseEvents(raw: any[]): RawEvent[] {
  return raw.filter(
    (e) => e && e.properties && typeof e.properties.time === "number"
  ) as RawEvent[];
}

function emptyResponse(
  projectId: number,
  message: string
): AnalysisResponse {
  return {
    projectId,
    analysisType: "calendar",
    status: "empty",
    requiredEvents: [message],
    metrics: [],
    charts: [],
    insights: [],
    warnings: ["데이터가 없습니다. 이벤트 이름과 날짜 범위를 확인하세요."],
  };
}

export async function analyzeCalendar(
  client: MixpanelClient,
  projectId: number,
  events: { primary: string; conversion: string; exploration: string },
  fromDate: string,
  toDate: string
): Promise<AnalysisResponse> {
  // ── 1. Fetch raw events ──
  let primaryRaw: any[];
  try {
    primaryRaw = await client.exportEvents(
      projectId,
      fromDate,
      toDate,
      events.primary,
      50000
    );
  } catch (err) {
    return emptyResponse(
      projectId,
      `Primary 이벤트(${events.primary})를 가져오는 데 실패했습니다.`
    );
  }

  const primaryEvents = parseEvents(primaryRaw);
  if (primaryEvents.length === 0) {
    return emptyResponse(
      projectId,
      `이벤트(${events.primary})에 대한 데이터가 없습니다.`
    );
  }

  // ── Fetch conversion events (best-effort) ──
  let conversionEvents: RawEvent[] = [];
  let hasConversion = false;
  if (events.conversion) {
    try {
      const convRaw = await client.exportEvents(
        projectId,
        fromDate,
        toDate,
        events.conversion,
        50000
      );
      conversionEvents = parseEvents(convRaw);
      hasConversion = conversionEvents.length > 0;
    } catch {
      // Conversion data unavailable — proceed without
    }
  }

  // ── 2. Aggregate primary events ──
  const hourlyCounts = new Array<number>(24).fill(0);
  const heatmapCounts: Record<string, Record<HourBucket, number>> = {};
  const monthPhaseCounts: Record<string, number> = {
    월초: 0,
    월중: 0,
    월말: 0,
  };
  const dayTotals = new Array<number>(7).fill(0); // 0=Sun..6=Sat

  for (const day of DISPLAY_DAY_ORDER) {
    heatmapCounts[day] = {} as Record<HourBucket, number>;
    for (const bucket of HOUR_BUCKETS) {
      heatmapCounts[day][bucket] = 0;
    }
  }

  for (const ev of primaryEvents) {
    const d = new Date(ev.properties.time * 1000);
    const hour = d.getUTCHours();
    const dow = d.getUTCDay(); // 0=Sun
    const dom = d.getUTCDate();

    hourlyCounts[hour]++;
    dayTotals[dow]++;

    const dayName = DAY_NAMES[dow];
    const bucket = getHourBucket(hour);
    heatmapCounts[dayName][bucket]++;

    monthPhaseCounts[getMonthPhase(dom)]++;
  }

  // ── 3. Peak hour ──
  let peakHour = 0;
  let peakCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourlyCounts[h] > peakCount) {
      peakCount = hourlyCounts[h];
      peakHour = h;
    }
  }

  const totalPrimary = primaryEvents.length;

  // ── 4. Weekend conversion rate ──
  let weekendCVRStr = "N/A";
  if (hasConversion) {
    const weekendPrimary = primaryEvents.filter((e) =>
      isWeekend(new Date(e.properties.time * 1000).getUTCDay())
    ).length;
    const weekendConversion = conversionEvents.filter((e) =>
      isWeekend(new Date(e.properties.time * 1000).getUTCDay())
    ).length;
    if (weekendPrimary > 0) {
      weekendCVRStr =
        ((weekendConversion / weekendPrimary) * 100).toFixed(1) + "%";
    }
  }

  // ── 5. Month-end share ──
  const monthEndShare =
    totalPrimary > 0
      ? ((monthPhaseCounts["월말"] / totalPrimary) * 100).toFixed(1) + "%"
      : "0%";

  // ── 6. Golden time CVR (peak ± 1 hour) ──
  let goldenCVRStr = "N/A";
  if (hasConversion) {
    const goldenHours = new Set([
      (peakHour - 1 + 24) % 24,
      peakHour,
      (peakHour + 1) % 24,
    ]);
    const goldenPrimary = primaryEvents.filter((e) =>
      goldenHours.has(new Date(e.properties.time * 1000).getUTCHours())
    ).length;
    const goldenConversion = conversionEvents.filter((e) =>
      goldenHours.has(new Date(e.properties.time * 1000).getUTCHours())
    ).length;
    if (goldenPrimary > 0) {
      goldenCVRStr =
        ((goldenConversion / goldenPrimary) * 100).toFixed(1) + "%";
    }
  }

  // ── 7. Build chart data ──
  const hourlyChartData: BarChartData = Array.from({ length: 24 }, (_, h) => ({
    label: `${h}시`,
    value: hourlyCounts[h],
  }));

  const heatmapChartData: HeatmapChartData = [];
  for (const day of DISPLAY_DAY_ORDER) {
    for (const bucket of HOUR_BUCKETS) {
      heatmapChartData.push({
        x: bucket,
        y: day,
        value: heatmapCounts[day][bucket],
      });
    }
  }

  const monthPhaseChartData: BarChartData = [
    { label: "월초", value: monthPhaseCounts["월초"] },
    { label: "월중", value: monthPhaseCounts["월중"] },
    { label: "월말", value: monthPhaseCounts["월말"] },
  ];

  // ── 8. Insights ──
  const peakPct =
    totalPrimary > 0
      ? ((peakCount / totalPrimary) * 100).toFixed(1)
      : "0";

  // Most active day
  let maxDayIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (dayTotals[i] > dayTotals[maxDayIdx]) maxDayIdx = i;
  }
  const maxDayName = DAY_NAMES[maxDayIdx];

  const insights: string[] = [
    `피크 시간대는 ${peakHour}시이며, 전체 이벤트의 ${peakPct}%가 이 시간에 발생합니다.`,
    `${maxDayName}요일에 가장 많은 이벤트가 발생합니다.`,
  ];

  if (monthPhaseCounts["월말"] > monthPhaseCounts["월초"]) {
    const ratio =
      monthPhaseCounts["월초"] > 0
        ? (monthPhaseCounts["월말"] / monthPhaseCounts["월초"]).toFixed(1)
        : "∞";
    insights.push(
      `월말 이벤트가 월초 대비 ${ratio}배 많아, 급여일 효과가 추정됩니다.`
    );
  }

  // ── 9. Determine status ──
  const status: AnalysisResponse["status"] = hasConversion
    ? "ok"
    : "partial";
  const warnings: string[] = [];
  if (!hasConversion) {
    warnings.push(
      "전환 이벤트 데이터가 없어 전환율 지표가 N/A로 표시됩니다."
    );
  }

  return {
    projectId,
    analysisType: "calendar",
    status,
    metrics: [
      { label: "피크 시간대", value: `${peakHour}시` },
      { label: "주말 전환율", value: weekendCVRStr },
      { label: "월말 매출 비중", value: monthEndShare },
      { label: "골든 타임 CVR", value: goldenCVRStr },
    ],
    charts: [
      {
        id: "hourly",
        type: "bar",
        title: "시간대별 이벤트 추이",
        data: hourlyChartData,
      },
      {
        id: "heatmap",
        type: "heatmap",
        title: "요일 × 시간대 히트맵",
        data: heatmapChartData,
      },
      {
        id: "monthPhase",
        type: "bar",
        title: "월초/월중/월말 비교",
        data: monthPhaseChartData,
      },
    ],
    insights,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
