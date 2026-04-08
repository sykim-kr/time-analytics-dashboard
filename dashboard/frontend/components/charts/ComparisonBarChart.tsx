"use client";

import { useMemo } from "react";
import ChartHeader from "./ChartHeader";
import type { ChartQueryInfo } from "@/lib/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  data: { label: string; value: number; group?: string }[];
  title: string;
  eventLabel?: string;
  queryInfo?: ChartQueryInfo;
};

const GROUP_COLORS = ["#a855f7", "#6366f1", "#8b5cf6"];

export default function ComparisonBarChart({
  data,
  title,
  eventLabel,
  queryInfo,
}: Props) {
  const hasGroups = data.some((d) => d.group !== undefined);

  // Transform grouped data: { label, [group1]: value, [group2]: value, ... }
  const { chartData, groups } = useMemo(() => {
    if (!hasGroups) {
      return { chartData: data, groups: [] as string[] };
    }

    const groupSet = new Set<string>();
    const byLabel = new Map<string, Record<string, number | string>>();

    for (const d of data) {
      const g = d.group ?? "default";
      groupSet.add(g);
      const existing = byLabel.get(d.label) ?? { label: d.label };
      existing[g] = d.value;
      byLabel.set(d.label, existing);
    }

    return {
      chartData: Array.from(byLabel.values()),
      groups: Array.from(groupSet),
    };
  }, [data, hasGroups]);

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <ChartHeader title={title} eventLabel={eventLabel} queryInfo={queryInfo} />

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData as Record<string, unknown>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: 8,
              color: "#fff",
            }}
          />
          {hasGroups ? (
            <>
              <Legend />
              {groups.map((g, i) => (
                <Bar
                  key={g}
                  dataKey={g}
                  fill={GROUP_COLORS[i % GROUP_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </>
          ) : (
            <Bar
              dataKey="value"
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
