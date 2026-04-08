import { MixpanelClient } from "../mixpanel-client";
import type {
  AnalysisResponse,
  AreaChartData,
  BarChartData,
} from "../../types";

// ── Helpers ──

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
    analysisType: "context",
    status: "empty",
    requiredEvents: [message],
    metrics: [],
    charts: [],
    insights: [],
    warnings: ["데이터가 없습니다. 이벤트 이름과 날짜 범위를 확인하세요."],
  };
}

/** Returns YYYY-MM-DD for a unix-seconds timestamp */
function toDateKey(ts: number): string {
  const d = new Date(ts * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPaydayGroup(
  dayOfMonth: number
): "급여일 전(20-24일)" | "급여일(25일)" | "급여일 후(26-30일)" | "기타" {
  if (dayOfMonth >= 20 && dayOfMonth <= 24) return "급여일 전(20-24일)";
  if (dayOfMonth === 25) return "급여일(25일)";
  if (dayOfMonth >= 26 && dayOfMonth <= 30) return "급여일 후(26-30일)";
  return "기타";
}

function getDayOfWeekLabel(dow: number): "평일" | "토요일" | "일요일" {
  if (dow === 0) return "일요일";
  if (dow === 6) return "토요일";
  return "평일";
}

function pctChange(a: number, b: number): string {
  if (b === 0) return "N/A";
  return ((a - b) / b * 100).toFixed(1) + "%";
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

// ── Main analysis function ──

export async function analyzeContext(
  client: MixpanelClient,
  projectId: number,
  events: { target: string; comparison: string },
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
      events.target,
      50000
    );
  } catch (err) {
    return emptyResponse(
      projectId,
      `이벤트(${events.target})를 가져오는 데 실패했습니다.`
    );
  }

  const parsed = parseEvents(rawEvents);
  if (parsed.length === 0) {
    return emptyResponse(
      projectId,
      `이벤트(${events.target})에 대한 데이터가 없습니다.`
    );
  }

  // ── 2. Parse timestamps & detect campaign properties ──
  const allDates = new Set<string>();
  let hasCampaignProp = false;
  let hasUtmSource = false;

  for (const ev of parsed) {
    allDates.add(toDateKey(ev.properties.time));
    if (!hasCampaignProp && (ev.properties.campaign || ev.properties.utm_campaign)) {
      hasCampaignProp = true;
    }
    if (!hasUtmSource && (ev.properties.utm_source || ev.properties.referrer)) {
      hasUtmSource = true;
    }
  }

  const sortedDates = Array.from(allDates).sort();

  // ── 3. Campaign effect ──
  const campaignDaily: Record<string, number> = {};
  const nonCampaignDaily: Record<string, number> = {};

  for (const d of sortedDates) {
    campaignDaily[d] = 0;
    nonCampaignDaily[d] = 0;
  }

  let campaignLabel: string;
  let nonCampaignLabel: string;

  if (hasCampaignProp) {
    campaignLabel = "캠페인";
    nonCampaignLabel = "비캠페인";
    for (const ev of parsed) {
      const dateKey = toDateKey(ev.properties.time);
      if (ev.properties.campaign || ev.properties.utm_campaign) {
        campaignDaily[dateKey]++;
      } else {
        nonCampaignDaily[dateKey]++;
      }
    }
  } else {
    campaignLabel = "마케팅 채널 있음";
    nonCampaignLabel = "직접 방문";
    for (const ev of parsed) {
      const dateKey = toDateKey(ev.properties.time);
      if (ev.properties.utm_source || ev.properties.referrer) {
        campaignDaily[dateKey]++;
      } else {
        nonCampaignDaily[dateKey]++;
      }
    }
  }

  const campaignAreaData: AreaChartData = sortedDates.map((d) => ({
    x: d,
    [campaignLabel]: campaignDaily[d],
    [nonCampaignLabel]: nonCampaignDaily[d],
  }));

  const totalCampaignDays = sortedDates.filter((d) => campaignDaily[d] > 0).length || sortedDates.length;
  const totalNonCampaignDays = sortedDates.filter((d) => nonCampaignDaily[d] > 0).length || sortedDates.length;
  const campaignTotal = Object.values(campaignDaily).reduce((s, v) => s + v, 0);
  const nonCampaignTotal = Object.values(nonCampaignDaily).reduce((s, v) => s + v, 0);
  const campaignAvg = safeDivide(campaignTotal, totalCampaignDays);
  const nonCampaignAvg = safeDivide(nonCampaignTotal, totalNonCampaignDays);

  // ── 4. Payday effect ──
  const paydayGroups: Record<string, number[]> = {
    "급여일 전(20-24일)": [],
    "급여일(25일)": [],
    "급여일 후(26-30일)": [],
    "기타": [],
  };

  // Count events per day, then assign each day to a payday group
  const dailyCounts: Record<string, number> = {};
  for (const ev of parsed) {
    const dk = toDateKey(ev.properties.time);
    dailyCounts[dk] = (dailyCounts[dk] || 0) + 1;
  }

  for (const [dateStr, count] of Object.entries(dailyCounts)) {
    const dom = parseInt(dateStr.split("-")[2], 10);
    const group = getPaydayGroup(dom);
    paydayGroups[group].push(count);
  }

  const paydayAvgs: Record<string, number> = {};
  for (const [group, counts] of Object.entries(paydayGroups)) {
    paydayAvgs[group] = counts.length > 0
      ? counts.reduce((s, v) => s + v, 0) / counts.length
      : 0;
  }

  const paydayBarData: BarChartData = [
    { label: "급여일 전(20-24일)", value: Math.round(paydayAvgs["급여일 전(20-24일)"]) },
    { label: "급여일(25일)", value: Math.round(paydayAvgs["급여일(25일)"]) },
    { label: "급여일 후(26-30일)", value: Math.round(paydayAvgs["급여일 후(26-30일)"]) },
    { label: "기타", value: Math.round(paydayAvgs["기타"]) },
  ];

  // ── 5. Holiday/Weekend comparison ──
  const dowGroups: Record<string, number[]> = {
    "평일": [],
    "토요일": [],
    "일요일": [],
  };

  for (const [dateStr, count] of Object.entries(dailyCounts)) {
    const d = new Date(dateStr + "T00:00:00Z");
    const dow = d.getUTCDay();
    const label = getDayOfWeekLabel(dow);
    dowGroups[label].push(count);
  }

  const dowAvgs: Record<string, number> = {};
  for (const [label, counts] of Object.entries(dowGroups)) {
    dowAvgs[label] = counts.length > 0
      ? counts.reduce((s, v) => s + v, 0) / counts.length
      : 0;
  }

  const holidayBarData: BarChartData = [
    { label: "평일", value: Math.round(dowAvgs["평일"]) },
    { label: "토요일", value: Math.round(dowAvgs["토요일"]) },
    { label: "일요일", value: Math.round(dowAvgs["일요일"]) },
  ];

  // ── 6. Calculate metrics ──
  const campaignLiftStr =
    (hasCampaignProp || hasUtmSource) && nonCampaignAvg > 0
      ? pctChange(campaignAvg, nonCampaignAvg)
      : "N/A";

  const paydayEffectStr = pctChange(
    paydayAvgs["급여일(25일)"],
    paydayAvgs["기타"]
  );

  const weekendAvg = safeDivide(
    (dowAvgs["토요일"] + dowAvgs["일요일"]),
    2
  );
  const holidayChangeStr = pctChange(weekendAvg, dowAvgs["평일"]);

  const beforeAfterStr = pctChange(
    paydayAvgs["급여일 후(26-30일)"],
    paydayAvgs["급여일 전(20-24일)"]
  );

  // ── 7. Generate insights ──
  const insights: string[] = [];

  if (campaignLiftStr !== "N/A") {
    const liftVal = parseFloat(campaignLiftStr);
    if (liftVal > 0) {
      insights.push(
        `${campaignLabel} 이벤트가 ${nonCampaignLabel} 대비 일 평균 ${campaignLiftStr} 더 많이 발생합니다.`
      );
    } else {
      insights.push(
        `${nonCampaignLabel} 이벤트가 ${campaignLabel} 대비 오히려 더 많습니다. 캠페인 효과를 재검토하세요.`
      );
    }
  } else {
    insights.push(
      "캠페인/UTM 속성이 이벤트에 포함되어 있지 않아 캠페인 효과를 분석할 수 없습니다."
    );
  }

  if (paydayAvgs["급여일(25일)"] > paydayAvgs["기타"]) {
    insights.push(
      `급여일(25일)에 평소 대비 ${paydayEffectStr} 더 많은 이벤트가 발생합니다.`
    );
  } else {
    insights.push("급여일 효과가 뚜렷하지 않습니다.");
  }

  if (weekendAvg < dowAvgs["평일"]) {
    insights.push(
      `주말 평균 이벤트가 평일 대비 ${holidayChangeStr} 적습니다.`
    );
  } else {
    insights.push(
      `주말 평균 이벤트가 평일 대비 ${holidayChangeStr} 많습니다.`
    );
  }

  // ── 8. Determine status ──
  const status: AnalysisResponse["status"] =
    (hasCampaignProp || hasUtmSource) ? "ok" : "partial";
  const warnings: string[] = [];
  if (!hasCampaignProp && !hasUtmSource) {
    warnings.push(
      "캠페인/UTM 속성이 감지되지 않아 캠페인 효과 지표가 N/A입니다."
    );
  }

  return {
    projectId,
    analysisType: "context",
    status,
    metrics: [
      { label: "캠페인 Lift", value: campaignLiftStr },
      { label: "급여일 효과", value: paydayEffectStr },
      { label: "공휴일 변화", value: holidayChangeStr },
      { label: "Before/After", value: beforeAfterStr },
    ],
    charts: [
      {
        id: "campaignEffect",
        type: "area",
        title: "캠페인 효과 (일별 추이)",
        data: campaignAreaData,
      },
      {
        id: "paydayEffect",
        type: "bar",
        title: "급여일 효과 (일 평균 이벤트)",
        data: paydayBarData,
      },
      {
        id: "holidayComparison",
        type: "bar",
        title: "평일 vs 주말 비교 (일 평균 이벤트)",
        data: holidayBarData,
      },
    ],
    insights,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
