import type { AnalysisResponse, BarChartData, LineChartData } from "@/lib/types";

export function getMockData(projectId: number): AnalysisResponse {
  const frequencyData: BarChartData = [
    { label: "1-5", value: 3200 },
    { label: "6-10", value: 2800 },
    { label: "11-20", value: 2100 },
    { label: "21-50", value: 1400 },
    { label: "51-100", value: 600 },
    { label: "100+", value: 250 },
  ];

  const sessionInterval: LineChartData = Array.from({ length: 30 }, (_, i) => ({
    x: `Day ${i + 1}`,
    interval: +(2.1 + Math.sin(i / 5) * 0.4 + (i > 20 ? 0.3 : 0)).toFixed(1),
  }));

  const fastSlowPurchase: BarChartData = [
    { label: "전환율", value: 72, group: "Fast" },
    { label: "재구매율", value: 48, group: "Fast" },
    { label: "LTV", value: 185000, group: "Fast" },
    { label: "전환율", value: 21, group: "Slow" },
    { label: "재구매율", value: 12, group: "Slow" },
    { label: "LTV", value: 62000, group: "Slow" },
  ];

  return {
    projectId,
    analysisType: "velocity",
    status: "ok",
    metrics: [
      { label: "인당 이벤트 수", value: "23.4회" },
      { label: "평균 세션 간격", value: "2.1일" },
      { label: "퍼널 Lag", value: "4.2시간" },
      { label: "High Intent 비율", value: "18%" },
    ],
    charts: [
      { id: "frequency", type: "bar", title: "유저별 이벤트 빈도 분포", data: frequencyData },
      { id: "sessionInterval", type: "line", title: "세션 간격 추이", data: sessionInterval },
      { id: "fastSlowPurchase", type: "bar", title: "Fast vs Slow 구매 유저 비교", data: fastSlowPurchase },
    ],
    insights: [
      "빠르게 행동하는 유저(High Intent)의 전환율 3.2배 높음",
      "세션 간격 7일 이상 증가 시 Churn 위험 신호",
      "주간 10회 이상 이벤트 유저의 D30 리텐션 52%",
    ],
  };
}
