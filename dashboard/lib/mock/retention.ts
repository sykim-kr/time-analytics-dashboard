import type { AnalysisResponse, LineChartData, TableChartData } from "@/lib/types";

export function getMockData(projectId: number): AnalysisResponse {
  // Typical retention decay curve D0-D30
  const retentionCurve: LineChartData = [
    { x: "D0", retention: 100 },
    { x: "D1", retention: 42 },
    { x: "D2", retention: 36 },
    { x: "D3", retention: 33 },
    { x: "D5", retention: 30 },
    { x: "D7", retention: 28 },
    { x: "D10", retention: 24 },
    { x: "D14", retention: 20 },
    { x: "D21", retention: 16 },
    { x: "D25", retention: 15.5 },
    { x: "D30", retention: 15 },
  ];

  const cohortTable: TableChartData = {
    columns: ["코호트", "D1", "D7", "D14", "D21", "D30"],
    rows: [
      ["3월 1주", 45, 30, 22, 17, 16],
      ["3월 2주", 43, 29, 21, 16, 15],
      ["3월 3주", 40, 27, 19, 15, 14],
      ["3월 4주", 42, 28, 20, 16, 15],
    ],
  };

  const channelRetention: LineChartData = [
    { x: "D0", Organic: 100, Paid: 100, Referral: 100 },
    { x: "D1", Organic: 48, Paid: 35, Referral: 52 },
    { x: "D3", Organic: 40, Paid: 26, Referral: 44 },
    { x: "D7", Organic: 34, Paid: 20, Referral: 38 },
    { x: "D14", Organic: 26, Paid: 14, Referral: 30 },
    { x: "D21", Organic: 22, Paid: 11, Referral: 25 },
    { x: "D30", Organic: 20, Paid: 10, Referral: 23 },
  ];

  return {
    projectId,
    analysisType: "retention",
    status: "ok",
    metrics: [
      { label: "D1 리텐션", value: "42%" },
      { label: "D7 리텐션", value: "28%" },
      { label: "D30 리텐션", value: "15%" },
      { label: "Plateau 시점", value: "D21" },
    ],
    charts: [
      { id: "retentionCurve", type: "line", title: "리텐션 커브", data: retentionCurve },
      { id: "cohortTable", type: "table", title: "코호트 테이블", data: cohortTable },
      { id: "channelRetention", type: "line", title: "채널별 리텐션 비교", data: channelRetention },
    ],
    insights: [
      "D1에서 58% 이탈 — 온보딩 개선 필요",
      "D21 이후 리텐션 안정화 (plateau) — 습관 형성 성공",
      "Organic 유입 리텐션이 Paid 대비 1.8배 높음",
    ],
  };
}
