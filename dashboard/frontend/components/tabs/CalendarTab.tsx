"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { EventSelector } from "@/components/dashboard/EventSelector";
import TabContent from "@/components/dashboard/TabContent";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { InsightList } from "@/components/dashboard/InsightList";
import NLQueryPanel from "@/components/nlquery/NLQueryPanel";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import HeatmapChart from "@/components/charts/HeatmapChart";
import ComparisonBarChart from "@/components/charts/ComparisonBarChart";
import { API_URL } from "@/lib/api";
import type { EventSlot, AnalysisResponse, ChartQueryInfo } from "@/lib/types";

const EVENT_SLOTS: EventSlot[] = [
  {
    key: "primary",
    label: "핵심 이벤트",
    defaultCandidates: ["App Open", "Session Start", "Page View"],
    required: true,
  },
  {
    key: "conversion",
    label: "전환 이벤트",
    defaultCandidates: ["Purchase", "Order Completed"],
    required: false,
  },
  {
    key: "browse",
    label: "탐색 이벤트",
    defaultCandidates: ["Page View", "Content View", "Search"],
    required: false,
  },
];

export function CalendarTab() {
  const { selectedProject, availableEvents } = useMixpanelAuth();
  const [eventSelections, setEventSelections] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams({
    projectId: String(selectedProject?.id || 0),
    ...Object.fromEntries(
      Object.entries(eventSelections).map(([k, v]) => [`events.${k}`, v])
    ),
  });

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", "calendar", selectedProject?.id, eventSelections],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/analysis/calendar?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedProject,
  });

  const handleEventChange = useCallback((selections: Record<string, string>) => {
    setEventSelections(selections);
  }, []);

  const status = isLoading ? "loading" : error ? "error" : data?.status || "loading";

  const hourlyChart = data?.charts.find((c) => c.id === "hourly");
  const heatmapChart = data?.charts.find((c) => c.id === "heatmap");
  const monthPhaseChart = data?.charts.find((c) => c.id === "monthPhase");

  const makeQueryInfo = (chartEvents: { label: string; key: string }[], breakdown?: string): ChartQueryInfo => ({
    events: chartEvents
      .filter(e => eventSelections[e.key])
      .map(e => ({ label: e.label, value: eventSelections[e.key] })),
    period: "30일",
    breakdown,
  });

  return (
    <div className="space-y-5">
      <EventSelector
        slots={EVENT_SLOTS}
        availableEvents={availableEvents}
        onChange={handleEventChange}
        variant="default"
      />
      <TabContent status={status} requiredEvents={data?.requiredEvents} warnings={data?.warnings}>
        <KpiCards metrics={data?.metrics || []} />
        <div className="grid grid-cols-2 gap-4">
          {hourlyChart && (
            <TimeSeriesChart
              data={hourlyChart.data as { label: string; value: number }[]}
              chartType="bar"
              title={hourlyChart.title}
              queryInfo={makeQueryInfo([{ label: "이벤트", key: "primary" }], "Hour of Day")}
            />
          )}
          {heatmapChart && heatmapChart.type === "heatmap" && (
            <HeatmapChart
              data={heatmapChart.data}
              title={heatmapChart.title}
              xLabels={["0-3", "3-6", "6-9", "9-12", "12-15", "15-18", "18-21", "21-24"]}
              yLabels={["월", "화", "수", "목", "금", "토", "일"]}
              queryInfo={makeQueryInfo([{ label: "이벤트", key: "primary" }], "Day of Week × Hour")}
            />
          )}
          {monthPhaseChart && monthPhaseChart.type === "bar" && (
            <ComparisonBarChart
              data={monthPhaseChart.data}
              title={monthPhaseChart.title}
              queryInfo={makeQueryInfo([{ label: "이벤트", key: "primary" }], "Month Phase")}
            />
          )}
        </div>
        <InsightList insights={data?.insights || []} />
        <NLQueryPanel tab="calendar" />
      </TabContent>
    </div>
  );
}
