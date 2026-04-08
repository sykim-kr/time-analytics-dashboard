import type { AnalysisResponse, BarChartData } from "@/lib/types";

export function getMockData(projectId: number): AnalysisResponse {
  const timeDistribution: BarChartData = [
    { label: "1시간 이내", value: 1200 },
    { label: "1-6시간", value: 2100 },
    { label: "6-12시간", value: 1800 },
    { label: "12-24시간", value: 1500 },
    { label: "1-3일", value: 1100 },
    { label: "3-7일", value: 600 },
    { label: "7일+", value: 350 },
  ];

  const funnelLag: BarChartData = [
    { label: "Sign Up→조회", value: 2.1 },
    { label: "조회→장바구니", value: 4.8 },
    { label: "장바구니→구매", value: 8.3 },
  ];

  const fastSlowData: BarChartData = [
    { label: "전환율", value: 68, group: "Fast(1일 이내)" },
    { label: "재구매율", value: 42, group: "Fast(1일 이내)" },
    { label: "전환율", value: 23, group: "Slow(3일+)" },
    { label: "재구매율", value: 14, group: "Slow(3일+)" },
  ];

  return {
    projectId,
    analysisType: "timetox",
    status: "ok",
    metrics: [
      { label: "평균 전환 시간", value: "2.3일" },
      { label: "중앙값", value: "18시간" },
      { label: "Fast 유저 비율", value: "34%" },
      { label: "이탈 구간", value: "3일 이후" },
    ],
    charts: [
      { id: "timeDistribution", type: "bar", title: "전환 시간 분포", data: timeDistribution },
      { id: "funnelLag", type: "bar", title: "퍼널 단계별 소요 시간", data: funnelLag },
      { id: "fastSlow", type: "bar", title: "Fast vs Slow 유저 비교", data: fastSlowData },
    ],
    insights: [
      "가입 후 24시간 내 미활성 유저 이탈 확률 급증",
      "장바구니 후 3시간 내 구매 안 하면 전환율 급락",
      "Fast 유저(1일 내 전환)의 LTV가 Slow 유저 대비 2.1배",
    ],
  };
}
