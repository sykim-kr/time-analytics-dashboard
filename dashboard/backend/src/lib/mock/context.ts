import type { AnalysisResponse, AreaChartData, BarChartData } from "../../types";

export function getMockData(projectId: number): AnalysisResponse {
  const campaignEffect: AreaChartData = [
    { x: "D-7", traffic: 1200 },
    { x: "D-5", traffic: 1250 },
    { x: "D-3", traffic: 1300 },
    { x: "D-1", traffic: 1350 },
    { x: "캠페인 시작", traffic: 2100 },
    { x: "D+1", traffic: 2800 },
    { x: "D+3", traffic: 3200 },
    { x: "D+5", traffic: 2900 },
    { x: "D+7", traffic: 2400 },
    { x: "캠페인 종료", traffic: 3500 },
    { x: "D+9", traffic: 1800 },
    { x: "D+11", traffic: 1500 },
    { x: "D+14", traffic: 1300 },
  ];

  const paydayEffect: BarChartData = [
    { label: "급여일 전 7일", value: 2200 },
    { label: "급여일 후 3일", value: 4100 },
    { label: "급여일 후 7일", value: 3400 },
    { label: "기타", value: 2600 },
  ];

  const holidayComparison: BarChartData = [
    { label: "트래픽", value: 5200, group: "평일" },
    { label: "전환율", value: 3.2, group: "평일" },
    { label: "트래픽", value: 6900, group: "공휴일" },
    { label: "전환율", value: 4.1, group: "공휴일" },
    { label: "트래픽", value: 5980, group: "주말" },
    { label: "전환율", value: 3.8, group: "주말" },
  ];

  return {
    projectId,
    analysisType: "context",
    status: "ok",
    metrics: [
      { label: "캠페인 Lift", value: "+32%" },
      { label: "급여일 효과", value: "+28%" },
      { label: "공휴일 변화", value: "+15%" },
      { label: "Before/After", value: "+22%" },
    ],
    charts: [
      { id: "campaignEffect", type: "area", title: "캠페인 기간 전/중/후 비교", data: campaignEffect },
      { id: "paydayEffect", type: "bar", title: "급여일 전후 구매 패턴", data: paydayEffect },
      { id: "holidayComparison", type: "bar", title: "공휴일 vs 평일 비교", data: holidayComparison },
    ],
    insights: [
      "급여일 직후 3일간 고가 상품 구매 28% 증가",
      "캠페인 종료 직전 24시간 트래픽 폭증 (urgency 효과)",
      "공휴일 트래픽은 주말 대비 15% 높으며 체류 시간도 증가",
    ],
  };
}
