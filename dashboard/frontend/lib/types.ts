// lib/types.ts

// --- Auth ---
export type AuthState =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "loading_projects"
  | "project_selected"
  | "loading_analysis"
  | "ready"
  | "error";

export type MixpanelProject = {
  id: number;
  name: string;
};

// --- Chart Data Types ---
export type LineChartData = { x: string; [series: string]: number | string }[];
export type BarChartData = { label: string; value: number; group?: string }[];
export type HeatmapChartData = { x: string; y: string; value: number }[];
export type TableChartData = { columns: string[]; rows: (string | number)[][] };
export type AreaChartData = { x: string; [series: string]: number | string }[];
export type ScatterChartData = { x: number; y: number; label?: string }[];

export type ChartConfig =
  | { id: string; type: "line"; title: string; data: LineChartData }
  | { id: string; type: "bar"; title: string; data: BarChartData }
  | { id: string; type: "heatmap"; title: string; data: HeatmapChartData }
  | { id: string; type: "table"; title: string; data: TableChartData }
  | { id: string; type: "area"; title: string; data: AreaChartData }
  | { id: string; type: "scatter"; title: string; data: ScatterChartData };

export type AnalysisType = "calendar" | "timetox" | "retention" | "velocity" | "lifecycle" | "context";

export type AnalysisResponse = {
  projectId: number;
  analysisType: AnalysisType;
  status: "ok" | "partial" | "empty" | "error";
  requiredEvents?: string[];
  requiredProperties?: string[];
  metrics: Array<{ label: string; value: string | number; change?: string }>;
  charts: ChartConfig[];
  insights: string[];
  warnings?: string[];
};

export type ApiErrorResponse = {
  error: string;
  code: "auth_expired" | "invalid_params" | "upstream_error" | "rate_limited" | "not_found";
  details?: string;
};

// --- Chart Query Info ---
export type ChartQueryInfo = {
  events: { label: string; value: string }[];
  period?: string;
  breakdown?: string;
};

// --- Event Selector ---
export type EventSlot = {
  key: string;
  label: string;
  defaultCandidates: string[];
  required: boolean;
  value?: string;
};

// --- Schema ---
export type SchemaResponse = {
  events: Array<{
    name: string;
    properties: Array<{ name: string; type: string }>;
  }>;
  userProperties: Array<{ name: string; type: string }>;
};

// --- Tab Config ---
export type TabConfig = {
  id: AnalysisType;
  label: string;
  icon: string;
  eventSlots: EventSlot[];
  eventSelectorVariant?: "default" | "funnel";
};
