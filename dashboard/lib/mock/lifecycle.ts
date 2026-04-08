import type { AnalysisResponse, BarChartData, LineChartData } from "@/lib/types";

export function getMockData(projectId: number): AnalysisResponse {
  const lifecycleDistribution: BarChartData = [
    { label: "신규", value: 1800 },
    { label: "활성", value: 3100 },
    { label: "반복", value: 2400 },
    { label: "휴면", value: 2400 },
    { label: "이탈", value: 1800 },
    { label: "복귀", value: 800 },
  ];

  const churnTrend: LineChartData = [
    { x: "W1", churnRate: 15 },
    { x: "W2", churnRate: 16 },
    { x: "W3", churnRate: 14 },
    { x: "W4", churnRate: 17 },
    { x: "W5", churnRate: 19 },
    { x: "W6", churnRate: 18 },
    { x: "W7", churnRate: 20 },
    { x: "W8", churnRate: 19 },
    { x: "W9", churnRate: 21 },
    { x: "W10", churnRate: 18 },
    { x: "W11", churnRate: 17 },
    { x: "W12", churnRate: 16 },
  ];

  const reactivation: LineChartData = [
    { x: "W1", reactivationRate: 10 },
    { x: "W2", reactivationRate: 9 },
    { x: "W3", reactivationRate: 8 },
    { x: "W4", reactivationRate: 7 },
    { x: "W5", reactivationRate: 8 },
    { x: "W6", reactivationRate: 9 },
    { x: "W7", reactivationRate: 7 },
    { x: "W8", reactivationRate: 6 },
    { x: "W9", reactivationRate: 8 },
    { x: "W10", reactivationRate: 9 },
    { x: "W11", reactivationRate: 10 },
    { x: "W12", reactivationRate: 11 },
  ];

  return {
    projectId,
    analysisType: "lifecycle",
    status: "ok",
    metrics: [
      { label: "활성 유저 비율", value: "31%" },
      { label: "휴면 유저 비율", value: "24%" },
      { label: "Churn Rate", value: "18%" },
      { label: "복귀율", value: "8%" },
    ],
    charts: [
      { id: "lifecycleDistribution", type: "bar", title: "Lifecycle 상태 분포", data: lifecycleDistribution },
      { id: "churnTrend", type: "line", title: "Churn 위험 추이", data: churnTrend },
      { id: "reactivation", type: "line", title: "복귀(Reactivation) 트렌드", data: reactivation },
    ],
    insights: [
      "휴면 7일 이후 복귀율 급감 — 7일 내 CRM 개입 필요",
      "반복 유저(2회+ 활동)의 LTV가 평균 대비 3.5배",
      "이탈 직전 세션 빈도 50% 감소 패턴 발견",
    ],
  };
}
