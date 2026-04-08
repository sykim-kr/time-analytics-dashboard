"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { EventSelector } from "@/components/dashboard/EventSelector";
import TabContent from "@/components/dashboard/TabContent";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { InsightList } from "@/components/dashboard/InsightList";
import NLQueryPanel from "@/components/nlquery/NLQueryPanel";
import DistributionChart from "@/components/charts/DistributionChart";
import FunnelLagChart from "@/components/charts/FunnelLagChart";
import ComparisonBarChart from "@/components/charts/ComparisonBarChart";
import { API_URL } from "@/lib/api";
import type { EventSlot, AnalysisResponse, ChartQueryInfo } from "@/lib/types";

const EVENT_SLOTS: EventSlot[] = [
  {
    key: "start",
    label: "퍼널 시작",
    defaultCandidates: ["Sign Up", "Signup"],
    required: true,
  },
  {
    key: "middle",
    label: "퍼널 중간",
    defaultCandidates: ["Add to Cart", "Cart Added"],
    required: false,
  },
  {
    key: "end",
    label: "퍼널 완료",
    defaultCandidates: ["Purchase", "Order Completed"],
    required: true,
  },
];

export function TimeToXTab() {
  const { selectedProject, availableEvents } = useMixpanelAuth();
  const [eventSelections, setEventSelections] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams({
    projectId: String(selectedProject?.id || 0),
    ...Object.fromEntries(
      Object.entries(eventSelections).map(([k, v]) => [`events.${k}`, v])
    ),
  });

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", "timetox", selectedProject?.id, eventSelections],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/analysis/timetox?${queryParams}`, { credentials: "include" });
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

  const timeDistChart = data?.charts.find((c) => c.id === "timeDistribution");
  const funnelLagChart = data?.charts.find((c) => c.id === "funnelLag");
  const fastSlowChart = data?.charts.find((c) => c.id === "fastSlow");

  return (
    <div className="space-y-5">
      <EventSelector
        slots={EVENT_SLOTS}
        availableEvents={availableEvents}
        onChange={handleEventChange}
        variant="funnel"
        loading={isLoading}
      />
      <TabContent status={status} requiredEvents={data?.requiredEvents} warnings={data?.warnings}>
        <KpiCards
          metrics={data?.metrics || []}
          queryInfo={makeQueryInfo(
            [{ label: "시작", key: "start" }, { label: "완료", key: "end" }],
            "Time to Convert"
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          {timeDistChart && timeDistChart.type === "bar" && (
            <DistributionChart
              data={timeDistChart.data}
              title={timeDistChart.title}
              queryInfo={makeQueryInfo([{label:"시작",key:"start"},{label:"완료",key:"end"}], "Time Bucket")}
            />
          )}
          {funnelLagChart && funnelLagChart.type === "bar" && (
            <FunnelLagChart
              data={funnelLagChart.data}
              title={funnelLagChart.title}
              queryInfo={makeQueryInfo([{label:"시작",key:"start"},{label:"중간",key:"middle"},{label:"완료",key:"end"}], "Funnel Step")}
            />
          )}
          {fastSlowChart && fastSlowChart.type === "bar" && (
            <ComparisonBarChart
              data={fastSlowChart.data}
              title={fastSlowChart.title}
              queryInfo={makeQueryInfo([{label:"시작",key:"start"},{label:"완료",key:"end"}], "Fast/Slow Split")}
            />
          )}
        </div>
        <InsightList insights={data?.insights || []} />
        <NLQueryPanel tab="timetox" />
      </TabContent>
    </div>
  );
}
