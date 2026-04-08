import type { AnalysisResponse, BarChartData, HeatmapChartData } from "@/lib/types";

export function getMockData(projectId: number): AnalysisResponse {
  const hourlyData: BarChartData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    // Simulate typical app usage: low at night, rising during day, peak at 21시
    const baseValues: Record<number, number> = {
      0: 120, 1: 80, 2: 50, 3: 30, 4: 25, 5: 40,
      6: 90, 7: 180, 8: 320, 9: 450, 10: 520, 11: 580,
      12: 620, 13: 550, 14: 510, 15: 530, 16: 560, 17: 610,
      18: 700, 19: 820, 20: 950, 21: 1100, 22: 980, 23: 650,
    };
    return { label: `${hour}시`, value: baseValues[hour] };
  });

  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const timeBlocks = ["0-3", "3-6", "6-9", "9-12", "12-15", "15-18", "18-21", "21-24"];
  const heatmapData: HeatmapChartData = [];
  for (const day of days) {
    for (const block of timeBlocks) {
      let value: number;
      const isWeekend = day === "토" || day === "일";
      if (block === "0-3") value = isWeekend ? 35 : 15;
      else if (block === "3-6") value = isWeekend ? 10 : 5;
      else if (block === "6-9") value = isWeekend ? 20 : 40;
      else if (block === "9-12") value = isWeekend ? 50 : 65;
      else if (block === "12-15") value = isWeekend ? 60 : 70;
      else if (block === "15-18") value = isWeekend ? 65 : 60;
      else if (block === "18-21") value = isWeekend ? 85 : 75;
      else value = isWeekend ? 95 : 80; // 21-24
      heatmapData.push({ x: block, y: day, value });
    }
  }

  const monthPhaseData: BarChartData = [
    { label: "월초", value: 2800 },
    { label: "월중", value: 3200 },
    { label: "월말", value: 4100 },
  ];

  return {
    projectId,
    analysisType: "calendar",
    status: "ok",
    metrics: [
      { label: "피크 시간대", value: "21시", change: "+12%" },
      { label: "주말 전환율", value: "4.2%", change: "+0.8%p" },
      { label: "월말 매출 비중", value: "38%", change: "-3%" },
      { label: "골든 타임 CVR", value: "5.7%", change: "+1.2%p" },
    ],
    charts: [
      { id: "hourly", type: "bar", title: "시간대별 이벤트 추이", data: hourlyData },
      { id: "heatmap", type: "heatmap", title: "요일 × 시간대 히트맵", data: heatmapData },
      { id: "monthPhase", type: "bar", title: "월초/월중/월말 비교", data: monthPhaseData },
    ],
    insights: [
      "야간 21~23시가 골든 타임 — 전환율이 평균 대비 2.3배 높음",
      "주말 저녁 시간대(토/일 18~24시)에 구매 행동 집중",
      "월말(21~30일) 매출 비중 38%로 급여일 효과 추정",
    ],
  };
}
