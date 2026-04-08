import { MixpanelClient } from "../mixpanel-client";
import type {
  AnalysisResponse,
  BarChartData,
  LineChartData,
} from "../../types";

// ── Helpers ──

interface RawEvent {
  event: string;
  properties: { time: number; distinct_id: string; [key: string]: any };
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
    analysisType: "velocity",
    status: "empty",
    requiredEvents: [message],
    metrics: [],
    charts: [],
    insights: [],
    warnings: ["데이터가 없습니다. 이벤트 이름과 날짜 범위를 확인하세요."],
  };
}

function formatDateKey(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getFrequencyBucket(count: number): string {
  if (count <= 5) return "1-5";
  if (count <= 10) return "6-10";
  if (count <= 20) return "11-20";
  if (count <= 50) return "21-50";
  return "50+";
}

const FREQUENCY_BUCKET_ORDER = ["1-5", "6-10", "11-20", "21-50", "50+"];

// ── Main export ──

export async function analyzeVelocity(
  client: MixpanelClient,
  projectId: number,
  events: { frequency: string; session: string; conversion: string },
  fromDate: string,
  toDate: string
): Promise<AnalysisResponse> {
  // ── 1. Export raw events for frequency event ──
  let frequencyRaw: any[];
  try {
    frequencyRaw = await client.exportEvents(
      projectId,
      fromDate,
      toDate,
      events.frequency,
      50000
    );
  } catch (err) {
    return emptyResponse(
      projectId,
      `Frequency 이벤트(${events.frequency})를 가져오는 데 실패했습니다.`
    );
  }

  const frequencyEvents = parseEvents(frequencyRaw);
  if (frequencyEvents.length === 0) {
    return emptyResponse(
      projectId,
      `이벤트(${events.frequency})에 대한 데이터가 없습니다.`
    );
  }

  // ── 2. Group events by user ──
  const userEvents = new Map<string, RawEvent[]>();
  for (const ev of frequencyEvents) {
    const uid = ev.properties.distinct_id;
    let list = userEvents.get(uid);
    if (!list) {
      list = [];
      userEvents.set(uid, list);
    }
    list.push(ev);
  }

  // Sort each user's events by time
  for (const list of userEvents.values()) {
    list.sort((a, b) => a.properties.time - b.properties.time);
  }

  const totalUsers = userEvents.size;

  // ── 3. Per-user frequency & session intervals ──
  const userFrequencies: number[] = [];
  const allIntervalsByDate = new Map<string, number[]>(); // date -> intervals in seconds
  let totalIntervalSum = 0;
  let totalIntervalCount = 0;

  for (const [, list] of userEvents) {
    userFrequencies.push(list.length);

    for (let i = 1; i < list.length; i++) {
      const gap = list[i].properties.time - list[i - 1].properties.time;
      if (gap > 0) {
        totalIntervalSum += gap;
        totalIntervalCount++;

        const dateKey = formatDateKey(list[i].properties.time);
        let dateIntervals = allIntervalsByDate.get(dateKey);
        if (!dateIntervals) {
          dateIntervals = [];
          allIntervalsByDate.set(dateKey, dateIntervals);
        }
        dateIntervals.push(gap);
      }
    }
  }

  // ── 4. Frequency distribution chart ──
  const bucketCounts: Record<string, number> = {};
  for (const b of FREQUENCY_BUCKET_ORDER) bucketCounts[b] = 0;

  for (const freq of userFrequencies) {
    bucketCounts[getFrequencyBucket(freq)]++;
  }

  const frequencyChartData: BarChartData = FREQUENCY_BUCKET_ORDER.map((b) => ({
    label: b,
    value: bucketCounts[b],
  }));

  // ── 5. Session interval trend chart (daily avg interval in days) ──
  const sortedDates = Array.from(allIntervalsByDate.keys()).sort();
  const sessionIntervalData: LineChartData = sortedDates.map((date) => {
    const intervals = allIntervalsByDate.get(date)!;
    const avgSec = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const avgDays = +(avgSec / 86400).toFixed(2);
    return { x: date, interval: avgDays };
  });

  // ── 6. Fast vs Slow conversion comparison ──
  let conversionChartData: BarChartData = [];
  let hasConversion = false;
  let avgFunnelLagSec = 0;

  if (events.conversion) {
    let conversionEvents: RawEvent[] = [];
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
      // conversion data unavailable
    }

    if (hasConversion) {
      // Map conversion events per user (first conversion time)
      const userFirstConversion = new Map<string, number>();
      for (const ev of conversionEvents) {
        const uid = ev.properties.distinct_id;
        const existing = userFirstConversion.get(uid);
        if (existing === undefined || ev.properties.time < existing) {
          userFirstConversion.set(uid, ev.properties.time);
        }
      }

      // For each user who has both frequency and conversion events,
      // compute lag = first conversion - first frequency event
      const fastUsers: { freq: number }[] = [];
      const slowUsers: { freq: number }[] = [];
      let funnelLagSum = 0;
      let funnelLagCount = 0;

      const FAST_THRESHOLD_SEC = 24 * 3600; // 24 hours

      for (const [uid, list] of userEvents) {
        const convTime = userFirstConversion.get(uid);
        if (convTime === undefined) continue;

        const firstFreqTime = list[0].properties.time;
        const lag = convTime - firstFreqTime;
        if (lag < 0) continue; // conversion before frequency event

        funnelLagSum += lag;
        funnelLagCount++;

        const userInfo = { freq: list.length };
        if (lag <= FAST_THRESHOLD_SEC) {
          fastUsers.push(userInfo);
        } else {
          slowUsers.push(userInfo);
        }
      }

      if (funnelLagCount > 0) {
        avgFunnelLagSec = funnelLagSum / funnelLagCount;
      }

      const fastAvgFreq =
        fastUsers.length > 0
          ? fastUsers.reduce((s, u) => s + u.freq, 0) / fastUsers.length
          : 0;
      const slowAvgFreq =
        slowUsers.length > 0
          ? slowUsers.reduce((s, u) => s + u.freq, 0) / slowUsers.length
          : 0;

      conversionChartData = [
        { label: "평균 이벤트 수", value: +fastAvgFreq.toFixed(1), group: "Fast (<24h)" },
        { label: "유저 수", value: fastUsers.length, group: "Fast (<24h)" },
        { label: "평균 이벤트 수", value: +slowAvgFreq.toFixed(1), group: "Slow (>24h)" },
        { label: "유저 수", value: slowUsers.length, group: "Slow (>24h)" },
      ];
    }
  }

  // ── 7. Metrics ──
  const meanFrequency =
    totalUsers > 0
      ? (userFrequencies.reduce((s, v) => s + v, 0) / totalUsers).toFixed(1)
      : "0";

  const meanIntervalDays =
    totalIntervalCount > 0
      ? (totalIntervalSum / totalIntervalCount / 86400).toFixed(1)
      : "N/A";

  let funnelLagStr = "N/A";
  if (hasConversion && avgFunnelLagSec > 0) {
    if (avgFunnelLagSec < 86400) {
      funnelLagStr = (avgFunnelLagSec / 3600).toFixed(1) + "시간";
    } else {
      funnelLagStr = (avgFunnelLagSec / 86400).toFixed(1) + "일";
    }
  }

  const highIntentUsers = userFrequencies.filter((f) => f > 20).length;
  const highIntentRatio =
    totalUsers > 0
      ? Math.round((highIntentUsers / totalUsers) * 100) + "%"
      : "0%";

  // ── 8. Insights ──
  const insights: string[] = [];

  if (totalUsers > 0) {
    insights.push(
      `총 ${totalUsers}명의 유저가 평균 ${meanFrequency}회 이벤트를 발생시켰습니다.`
    );
  }

  if (meanIntervalDays !== "N/A") {
    const intervalNum = parseFloat(meanIntervalDays);
    if (intervalNum > 7) {
      insights.push(
        `평균 세션 간격이 ${meanIntervalDays}일로 길어, 재방문 유도 전략이 필요합니다.`
      );
    } else {
      insights.push(
        `평균 세션 간격이 ${meanIntervalDays}일로, 비교적 활발한 재방문 패턴입니다.`
      );
    }
  }

  if (hasConversion && conversionChartData.length > 0) {
    const fastEntry = conversionChartData.find(
      (d) => d.group === "Fast (<24h)" && d.label === "유저 수"
    );
    const slowEntry = conversionChartData.find(
      (d) => d.group === "Slow (>24h)" && d.label === "유저 수"
    );
    if (fastEntry && slowEntry && fastEntry.value + slowEntry.value > 0) {
      const fastPct = (
        (fastEntry.value / (fastEntry.value + slowEntry.value)) *
        100
      ).toFixed(0);
      insights.push(
        `전환 유저 중 ${fastPct}%가 24시간 이내에 빠르게 전환했습니다.`
      );
    }
  }

  if (highIntentUsers > 0) {
    insights.push(
      `High Intent 유저(20회 초과)는 전체의 ${highIntentRatio}이며, 핵심 활성 유저 그룹입니다.`
    );
  }

  // ── 9. Build charts array ──
  const charts: AnalysisResponse["charts"] = [
    {
      id: "frequency",
      type: "bar",
      title: "유저별 이벤트 빈도 분포",
      data: frequencyChartData,
    },
    {
      id: "sessionInterval",
      type: "line",
      title: "세션 간격 추이",
      data: sessionIntervalData,
    },
  ];

  if (hasConversion && conversionChartData.length > 0) {
    charts.push({
      id: "fastSlowPurchase",
      type: "bar",
      title: "Fast vs Slow 전환 유저 비교",
      data: conversionChartData,
    });
  }

  // ── 10. Status & warnings ──
  const warnings: string[] = [];
  if (!hasConversion) {
    warnings.push(
      "전환 이벤트 데이터가 없어 퍼널 Lag 및 Fast/Slow 비교가 표시되지 않습니다."
    );
  }
  if (sessionIntervalData.length === 0) {
    warnings.push(
      "세션 간격 데이터가 부족합니다. 유저당 2건 이상의 이벤트가 필요합니다."
    );
  }

  const status: AnalysisResponse["status"] = hasConversion ? "ok" : "partial";

  return {
    projectId,
    analysisType: "velocity",
    status,
    metrics: [
      { label: "인당 이벤트 수", value: `${meanFrequency}회` },
      { label: "평균 세션 간격", value: meanIntervalDays === "N/A" ? "N/A" : `${meanIntervalDays}일` },
      { label: "퍼널 Lag", value: funnelLagStr },
      { label: "High Intent 비율", value: highIntentRatio },
    ],
    charts,
    insights,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
