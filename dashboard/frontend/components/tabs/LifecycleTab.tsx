"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { EventSelector } from "@/components/dashboard/EventSelector";
import TabContent from "@/components/dashboard/TabContent";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { InsightList } from "@/components/dashboard/InsightList";
import NLQueryPanel from "@/components/nlquery/NLQueryPanel";
import ComparisonBarChart from "@/components/charts/ComparisonBarChart";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { API_URL } from "@/lib/api";
import type { EventSlot, AnalysisResponse, ChartQueryInfo } from "@/lib/types";

const EVENT_SLOTS: EventSlot[] = [
  {
    key: "signup",
    label: "가입 이벤트",
    defaultCandidates: ["Sign Up", "Signup"],
    required: true,
  },
  {
    key: "active",
    label: "활성 측정",
    defaultCandidates: ["App Open", "Session Start", "Page View"],
    required: true,
  },
];

export function LifecycleTab() {
  const { selectedProject, availableEvents } = useMixpanelAuth();
  const [eventSelections, setEventSelections] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams({
    projectId: String(selectedProject?.id || 0),
    ...Object.fromEntries(
      Object.entries(eventSelections).map(([k, v]) => [`events.${k}`, v])
    ),
  });

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", "lifecycle", selectedProject?.id, eventSelections],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/analysis/lifecycle?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedProject,
  });

  const handleEventChange = useCallback((selections: Record<string, string>) => {
    setEventSelections(selections);
  }, []);

  const status = isLoading ? "loading" : error ? "error" : data?.status || "loading";

  const makeQueryInfo = (chartEvents: { label: string; key: string }[], breakdown?: string): ChartQueryInfo => ({
    events: chartEvents
      .filter(e => eventSelections[e.key])
      .map(e => ({ label: e.label, value: eventSelections[e.key] })),
    period: "30일",
    breakdown,
  });

  const lifecycleDistChart = data?.charts.find((c) => c.id === "lifecycleDistribution");
  const churnTrendChart = data?.charts.find((c) => c.id === "churnTrend");
  const reactivationChart = data?.charts.find((c) => c.id === "reactivation");

  return (
    <div className="space-y-5">
      <EventSelector
        slots={EVENT_SLOTS}
        availableEvents={availableEvents}
        onChange={handleEventChange}
        variant="default"
        loading={isLoading}
      />
      <TabContent status={status} requiredEvents={data?.requiredEvents} warnings={data?.warnings}>
        <KpiCards
          metrics={data?.metrics || []}
          queryInfo={makeQueryInfo(
            [{ label: "가입", key: "signup" }, { label: "활성 측정", key: "active" }],
            "Lifecycle State"
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          {lifecycleDistChart && lifecycleDistChart.type === "bar" && (
            <ComparisonBarChart
              data={lifecycleDistChart.data}
              title={lifecycleDistChart.title}
              queryInfo={makeQueryInfo([{label:"활성 측정",key:"active"}], "Lifecycle State")}
            />
          )}
          {churnTrendChart && (
            <TimeSeriesChart
              data={churnTrendChart.data as { x: string; [series: string]: number | string }[]}
              chartType="line"
              title={churnTrendChart.title}
              queryInfo={makeQueryInfo([{label:"활성 측정",key:"active"}], "Weekly Churn")}
            />
          )}
          {reactivationChart && (
            <TimeSeriesChart
              data={reactivationChart.data as { x: string; [series: string]: number | string }[]}
              chartType="line"
              title={reactivationChart.title}
              queryInfo={makeQueryInfo([{label:"활성 측정",key:"active"}], "Weekly Reactivation")}
            />
          )}
        </div>
        <InsightList insights={data?.insights || []} />
        <NLQueryPanel tab="lifecycle" />
      </TabContent>
    </div>
  );
}
