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
    key: "frequency",
    label: "빈도 측정",
    defaultCandidates: ["App Open", "Page View"],
    required: true,
  },
  {
    key: "session",
    label: "세션 이벤트",
    defaultCandidates: ["Session Start", "App Open"],
    required: false,
  },
  {
    key: "conversion",
    label: "전환 이벤트",
    defaultCandidates: ["Purchase", "Order Completed"],
    required: false,
  },
];

export function VelocityTab() {
  const { selectedProject, availableEvents } = useMixpanelAuth();
  const [eventSelections, setEventSelections] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams({
    projectId: String(selectedProject?.id || 0),
    ...Object.fromEntries(
      Object.entries(eventSelections).map(([k, v]) => [`events.${k}`, v])
    ),
  });

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", "velocity", selectedProject?.id, eventSelections],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/analysis/velocity?${queryParams}`, { credentials: "include" });
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

  const frequencyChart = data?.charts.find((c) => c.id === "frequency");
  const sessionIntervalChart = data?.charts.find((c) => c.id === "sessionInterval");
  const fastSlowPurchaseChart = data?.charts.find((c) => c.id === "fastSlowPurchase");

  return (
    <div className="space-y-5">
      <EventSelector
        slots={EVENT_SLOTS}
        availableEvents={availableEvents}
        onChange={handleEventChange}
        variant="default"
      />
      <TabContent status={status} requiredEvents={data?.requiredEvents} warnings={data?.warnings}>
        <KpiCards
          metrics={data?.metrics || []}
          queryInfo={makeQueryInfo(
            [{ label: "빈도 측정", key: "frequency" }, { label: "전환", key: "conversion" }],
            "Events per User"
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          {frequencyChart && frequencyChart.type === "bar" && (
            <ComparisonBarChart
              data={frequencyChart.data}
              title={frequencyChart.title}
              queryInfo={makeQueryInfo([{label:"빈도 측정",key:"frequency"}], "Event Count Bucket")}
            />
          )}
          {sessionIntervalChart && (
            <TimeSeriesChart
              data={sessionIntervalChart.data as { x: string; [series: string]: number | string }[]}
              chartType="line"
              title={sessionIntervalChart.title}
              queryInfo={makeQueryInfo([{label:"세션",key:"session"}], "Daily Avg Interval")}
            />
          )}
          {fastSlowPurchaseChart && fastSlowPurchaseChart.type === "bar" && (
            <ComparisonBarChart
              data={fastSlowPurchaseChart.data}
              title={fastSlowPurchaseChart.title}
              queryInfo={makeQueryInfo([{label:"빈도 측정",key:"frequency"},{label:"전환",key:"conversion"}], "Fast/Slow")}
            />
          )}
        </div>
        <InsightList insights={data?.insights || []} />
        <NLQueryPanel tab="velocity" />
      </TabContent>
    </div>
  );
}
