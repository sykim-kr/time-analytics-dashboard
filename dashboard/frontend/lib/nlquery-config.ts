export const NL_QUERY_API_URL =
  process.env.NEXT_PUBLIC_NL_QUERY_API_URL || "https://mixpanel-nl-query-production.up.railway.app";

export type AnalysisTabKey =
  | "calendar"
  | "timetox"
  | "retention"
  | "velocity"
  | "lifecycle"
  | "context";

export const TAB_EXAMPLES: Record<AnalysisTabKey, string[]> = {
  calendar: [
    "가장 이벤트가 많은 시간대(Golden Time)는 언제인가요?",
    "주말과 평일의 전환율 차이가 있나요?",
    "월초/월중/월말 중 매출이 집중되는 시기는?",
    "시간대별 전환율이 가장 높은 때는?",
  ],
  timetox: [
    "가입 후 첫 구매까지 평균 얼마나 걸리나요?",
    "장바구니 담기에서 결제까지 지연되는 구간은?",
    "빠르게 전환하는 유저 vs 느린 유저의 차이점은?",
    "푸시 발송 후 반응까지 걸리는 시간은?",
  ],
  retention: [
    "D1 리텐션이 가장 높은 코호트는?",
    "리텐션이 안정화(plateau)되는 시점은?",
    "특정 행동을 한 유저의 리텐션이 더 높나요?",
    "채널별 리텐션 차이가 있나요?",
  ],
  velocity: [
    "High Intent 유저는 어떤 특징이 있나요?",
    "세션 간격이 늘어나면 이탈률이 높아지나요?",
    "검색 후 구매까지의 Lag는 얼마인가요?",
    "가장 활발한 유저의 인당 이벤트 수는?",
  ],
  lifecycle: [
    "현재 Churn 위험이 있는 유저는 몇 명인가요?",
    "휴면 유저가 복귀하는 비율은?",
    "VIP 유저의 반복 구매 패턴은?",
    "Churn 직전에 보이는 행동 신호는?",
  ],
  context: [
    "급여일 전후로 구매 패턴이 달라지나요?",
    "캠페인 기간에 전환율이 얼마나 상승했나요?",
    "주말과 평일의 트래픽 차이는?",
    "프로모션 종료 후에도 효과가 유지되나요?",
  ],
};

export type NLQueryResult = {
  answer: string;
  metadata?: {
    toolCalls?: string[];
    dateRange?: string;
    dimensions?: string[];
    metrics?: string[];
  };
  table?: {
    columns: string[];
    rows: (string | number)[][];
    totalRows?: number;
  };
  chart?: {
    type: "line" | "bar";
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
};

export type NLQueryStatus = {
  step: string;
  iteration?: number;
  message: string;
  tool?: string;
};
