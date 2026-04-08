"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { EventSelector } from "@/components/dashboard/EventSelector";
import TabContent from "@/components/dashboard/TabContent";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { InsightList } from "@/components/dashboard/InsightList";
import NLQueryPanel from "@/components/nlquery/NLQueryPanel";
import RetentionCurveChart from "@/components/charts/RetentionCurveChart";
import CohortTable from "@/components/charts/CohortTable";
import { API_URL } from "@/lib/api";
import type { EventSlot, AnalysisResponse } from "@/lib/types";

const EVENT_SLOTS: EventSlot[] = [
  {
    key: "cohort",
    label: "코호트 기준",
    defaultCandidates: ["Sign Up", "Signup"],
    required: true,
  },
  {
    key: "returnEvent",
    label: "리텐션 측정",
    defaultCandidates: ["App Open", "Session Start", "Page View"],
    required: true,
  },
];

export function RetentionTab() {
  const { selectedProject, availableEvents } = useMixpanelAuth();
  const [eventSelections, setEventSelections] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams({
    projectId: String(selectedProject?.id || 0),
    ...Object.fromEntries(
      Object.entries(eventSelections).map(([k, v]) => [`events.${k}`, v])
    ),
  });

  const { data, isLoading, error } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", "retention", selectedProject?.id, eventSelections],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/analysis/retention?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedProject,
  });

  const handleEventChange = useCallback((selections: Record<string, string>) => {
    setEventSelections(selections);
  }, []);

  const status = isLoading ? "loading" : error ? "error" : data?.status || "loading";

  const retentionCurve = data?.charts.find((c) => c.id === "retentionCurve");
  const cohortTable = data?.charts.find((c) => c.id === "cohortTable");
  const channelRetention = data?.charts.find((c) => c.id === "channelRetention");

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
          {retentionCurve && retentionCurve.type === "line" && (
            <RetentionCurveChart
              data={retentionCurve.data}
              title={retentionCurve.title}
            />
          )}
          {cohortTable && cohortTable.type === "table" && (
            <CohortTable
              data={cohortTable.data}
              title={cohortTable.title}
            />
          )}
          {channelRetention && channelRetention.type === "line" && (
            <RetentionCurveChart
              data={channelRetention.data}
              title={channelRetention.title}
            />
          )}
        </div>
        <InsightList insights={data?.insights || []} />
        <NLQueryPanel tab="retention" />
      </TabContent>
    </div>
  );
}
