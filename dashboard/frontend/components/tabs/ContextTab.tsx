"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { EventSelector } from "@/components/dashboard/EventSelector";
import TabContent from "@/components/dashboard/TabContent";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { InsightList } from "@/components/dashboard/InsightList";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import ComparisonBarChart from "@/components/charts/ComparisonBarChart";
import { API_URL } from "@/lib/api";
import type { EventSlot, AnalysisResponse } from "@/lib/types";

const EVENT_SLOTS: EventSlot[] = [
  {
    key: "target",
    label: "분석 대상",
    defaultCandidates: ["Purchase", "Order Completed", "App Open"],
    required: true,
  },
  {
    key: "contextProp",
    label: "비교 기준 속성",
    defaultCandidates: ["campaign", "utm_source"],
    required: false,
  },
];

export function ContextTab() {
  const { selectedProject, availableEvents } = useMixpanelAuth();
  const [eventSelections, setEventSelections] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams({
    projectId: String(selectedProject?.id || 0),
    ...Object.fromEntries(
      Object.entries(eventSelections).map(([k, v]) => [`events.${k}`, v])
    ),
  });

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", "context", selectedProject?.id, eventSelections],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/analysis/context?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedProject,
  });

  const handleEventChange = useCallback((selections: Record<string, string>) => {
    setEventSelections(selections);
  }, []);

  const status = isLoading ? "loading" : error ? "error" : data?.status || "loading";

  const campaignEffectChart = data?.charts.find((c) => c.id === "campaignEffect");
  const paydayEffectChart = data?.charts.find((c) => c.id === "paydayEffect");
  const holidayComparisonChart = data?.charts.find((c) => c.id === "holidayComparison");

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
          {campaignEffectChart && (
            <TimeSeriesChart
              data={campaignEffectChart.data as { x: string; [series: string]: number | string }[]}
              chartType="line"
              title={campaignEffectChart.title}
            />
          )}
          {paydayEffectChart && paydayEffectChart.type === "bar" && (
            <ComparisonBarChart
              data={paydayEffectChart.data}
              title={paydayEffectChart.title}
            />
          )}
          {holidayComparisonChart && holidayComparisonChart.type === "bar" && (
            <ComparisonBarChart
              data={holidayComparisonChart.data}
              title={holidayComparisonChart.title}
            />
          )}
        </div>
        <InsightList insights={data?.insights || []} />
      </TabContent>
    </div>
  );
}
