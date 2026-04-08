import { MixpanelClient } from "../mixpanel-client";
import type { AnalysisResponse, BarChartData } from "../../types";

// ── Time bucket definitions ──

const TIME_BUCKETS = [
  { label: "1시간 이내", minH: 0, maxH: 1 },
  { label: "1-6시간", minH: 1, maxH: 6 },
  { label: "6-12시간", minH: 6, maxH: 12 },
  { label: "12-24시간", minH: 12, maxH: 24 },
  { label: "1-3일", minH: 24, maxH: 72 },
  { label: "3-7일", minH: 72, maxH: 168 },
  { label: "7일+", minH: 168, maxH: Infinity },
] as const;

// ── Helpers ──

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}분`;
  if (hours < 24) return `${hours.toFixed(1)}시간`;
  return `${(hours / 24).toFixed(1)}일`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function bucketLabel(hours: number): string {
  for (const b of TIME_BUCKETS) {
    if (hours >= b.minH && hours < b.maxH) return b.label;
  }
  return "7일+";
}

// ── Types for internal use ──

interface UserTimeline {
  startTime: number; // epoch ms
  middleTime?: number;
  endTime?: number;
}

// ── Main analysis function ──

export async function analyzeTimeToX(
  client: MixpanelClient,
  projectId: number,
  events: { start: string; middle?: string; end: string },
  fromDate: string,
  toDate: string
): Promise<AnalysisResponse> {
  // 1. Export raw events for start and end (and middle if provided)
  let startEvents: any[];
  let endEvents: any[];
  let middleEvents: any[] = [];

  try {
    [startEvents, endEvents] = await Promise.all([
      client.exportEvents(projectId, fromDate, toDate, events.start, 50000),
      client.exportEvents(projectId, fromDate, toDate, events.end, 50000),
    ]);

    if (events.middle) {
      middleEvents = await client.exportEvents(
        projectId,
        fromDate,
        toDate,
        events.middle,
        50000
      );
    }
  } catch (error) {
    return {
      projectId,
      analysisType: "timetox",
      status: "error",
      metrics: [],
      charts: [],
      insights: [],
      warnings: [
        `이벤트 데이터를 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }

  // Empty check
  if (startEvents.length === 0 && endEvents.length === 0) {
    return {
      projectId,
      analysisType: "timetox",
      status: "empty",
      metrics: [],
      charts: [],
      insights: [],
      warnings: ["선택한 기간에 이벤트 데이터가 없습니다."],
    };
  }

  // 2. Build user maps
  const userMap = new Map<string, UserTimeline>();

  // Process start events — keep earliest per user
  for (const ev of startEvents) {
    const uid: string | undefined =
      ev.properties?.distinct_id ?? ev.properties?.$distinct_id;
    if (!uid) continue;
    const time: number = (ev.properties?.time ?? 0) * 1000; // Mixpanel exports time as epoch seconds
    const existing = userMap.get(uid);
    if (!existing || time < existing.startTime) {
      userMap.set(uid, { startTime: time, middleTime: existing?.middleTime, endTime: existing?.endTime });
    }
  }

  // Process end events — keep earliest end AFTER start per user
  for (const ev of endEvents) {
    const uid: string | undefined =
      ev.properties?.distinct_id ?? ev.properties?.$distinct_id;
    if (!uid) continue;
    const time: number = (ev.properties?.time ?? 0) * 1000;
    const existing = userMap.get(uid);
    if (!existing) continue; // no start event for this user
    if (time <= existing.startTime) continue; // end must be after start
    if (!existing.endTime || time < existing.endTime) {
      existing.endTime = time;
    }
  }

  // Process middle events if provided
  if (events.middle) {
    for (const ev of middleEvents) {
      const uid: string | undefined =
        ev.properties?.distinct_id ?? ev.properties?.$distinct_id;
      if (!uid) continue;
      const time: number = (ev.properties?.time ?? 0) * 1000;
      const existing = userMap.get(uid);
      if (!existing) continue;
      if (time <= existing.startTime) continue;
      if (existing.endTime && time >= existing.endTime) continue; // middle must be between start and end
      if (!existing.middleTime || time < existing.middleTime) {
        existing.middleTime = time;
      }
    }
  }

  // 3. Compute time-to-convert (hours) for converters
  const converters: { uid: string; hours: number; timeline: UserTimeline }[] = [];
  const nonConverterDropBuckets: Record<string, number> = {};

  for (const [uid, tl] of userMap) {
    if (tl.endTime) {
      const hours = (tl.endTime - tl.startTime) / (1000 * 60 * 60);
      converters.push({ uid, hours, timeline: tl });
    } else {
      // Track how long ago the start was for non-converters (approximate drop-off bucket)
      const hoursSinceStart =
        (Date.now() - tl.startTime) / (1000 * 60 * 60);
      const bucket = bucketLabel(hoursSinceStart);
      nonConverterDropBuckets[bucket] = (nonConverterDropBuckets[bucket] || 0) + 1;
    }
  }

  if (converters.length === 0) {
    return {
      projectId,
      analysisType: "timetox",
      status: "empty",
      metrics: [],
      charts: [],
      insights: ["전환한 유저가 없습니다. 이벤트 매핑을 확인해주세요."],
    };
  }

  const conversionHours = converters.map((c) => c.hours);

  // 4. Time distribution chart
  const distributionCounts: Record<string, number> = {};
  for (const b of TIME_BUCKETS) distributionCounts[b.label] = 0;
  for (const h of conversionHours) {
    distributionCounts[bucketLabel(h)]++;
  }
  const timeDistribution: BarChartData = TIME_BUCKETS.map((b) => ({
    label: b.label,
    value: distributionCounts[b.label],
  }));

  // 5. Funnel lag chart
  const funnelLag: BarChartData = [];
  if (events.middle) {
    const startToMiddle: number[] = [];
    const middleToEnd: number[] = [];

    for (const c of converters) {
      const tl = c.timeline;
      if (tl.middleTime) {
        startToMiddle.push((tl.middleTime - tl.startTime) / (1000 * 60 * 60));
        middleToEnd.push((tl.endTime! - tl.middleTime) / (1000 * 60 * 60));
      }
    }

    if (startToMiddle.length > 0) {
      funnelLag.push({
        label: `${events.start}→${events.middle}`,
        value: parseFloat(mean(startToMiddle).toFixed(1)),
      });
      funnelLag.push({
        label: `${events.middle}→${events.end}`,
        value: parseFloat(mean(middleToEnd).toFixed(1)),
      });
    }
    funnelLag.push({
      label: `${events.start}→${events.end}`,
      value: parseFloat(mean(conversionHours).toFixed(1)),
    });
  } else {
    funnelLag.push({
      label: `${events.start}→${events.end}`,
      value: parseFloat(mean(conversionHours).toFixed(1)),
    });
  }

  // 6. Fast vs Slow comparison
  const medianHours = median(conversionHours);
  const fastUsers = converters.filter((c) => c.hours <= medianHours);
  const slowUsers = converters.filter((c) => c.hours > medianHours);

  const fastSlowData: BarChartData = [
    { label: "유저 수", value: fastUsers.length, group: "Fast(중앙값 이하)" },
    { label: "평균 전환 시간(h)", value: parseFloat(mean(fastUsers.map((u) => u.hours)).toFixed(1)), group: "Fast(중앙값 이하)" },
    { label: "유저 수", value: slowUsers.length, group: "Slow(중앙값 초과)" },
    { label: "평균 전환 시간(h)", value: parseFloat(mean(slowUsers.map((u) => u.hours)).toFixed(1)), group: "Slow(중앙값 초과)" },
  ];

  // 7. Calculate metrics
  const avgHours = mean(conversionHours);
  const medHours = median(conversionHours);
  const fastPct = Math.round(
    (conversionHours.filter((h) => h <= 24).length / conversionHours.length) * 100
  );

  // Determine drop-off bucket (where most non-converters are)
  let dropBucket = "N/A";
  let maxDropCount = 0;
  for (const [bucket, count] of Object.entries(nonConverterDropBuckets)) {
    if (count > maxDropCount) {
      maxDropCount = count;
      dropBucket = bucket;
    }
  }

  const metrics = [
    { label: "평균 전환 시간", value: formatDuration(avgHours) },
    { label: "중앙값", value: formatDuration(medHours) },
    { label: "Fast 유저 비율", value: `${fastPct}%` },
    { label: "이탈 구간", value: maxDropCount > 0 ? dropBucket : "데이터 부족" },
  ];

  // 8. Insights
  const insights: string[] = [
    `평균 전환 시간은 ${formatDuration(avgHours)}이며, 중앙값은 ${formatDuration(medHours)}입니다.`,
    `전체 유저의 ${fastPct}%가 24시간 이내에 전환합니다.`,
  ];

  if (maxDropCount > 0) {
    insights.push(`이탈이 가장 많은 구간은 "${dropBucket}" 입니다.`);
  }

  // Determine status
  const status =
    startEvents.length >= 50000 || endEvents.length >= 50000
      ? "partial"
      : "ok";

  const warnings: string[] = [];
  if (status === "partial") {
    warnings.push("데이터 제한(50,000건)에 도달했습니다. 기간을 줄이면 더 정확한 결과를 얻을 수 있습니다.");
  }

  return {
    projectId,
    analysisType: "timetox",
    status,
    metrics,
    charts: [
      { id: "timeDistribution", type: "bar", title: "전환 시간 분포", data: timeDistribution },
      { id: "funnelLag", type: "bar", title: "퍼널 단계별 소요 시간(평균, 시간)", data: funnelLag },
      { id: "fastSlow", type: "bar", title: "Fast vs Slow 유저 비교", data: fastSlowData },
    ],
    insights,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
