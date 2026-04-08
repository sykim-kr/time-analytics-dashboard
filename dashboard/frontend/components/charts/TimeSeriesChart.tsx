"use client";

import ChartHeader from "./ChartHeader";
import type { ChartQueryInfo } from "@/lib/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  data:
    | { label: string; value: number; group?: string }[]
    | { x: string; [series: string]: number | string }[];
  chartType: "bar" | "line";
  title: string;
  eventLabel?: string;
  queryInfo?: ChartQueryInfo;
};

export default function TimeSeriesChart({
  data,
  chartType,
  title,
  eventLabel,
  queryInfo,
}: Props) {
  // Normalize data: detect shape and pick dataKey for x-axis
  const isXKeyed = data.length > 0 && "x" in data[0];
  const xKey = isXKeyed ? "x" : "label";
  const valueKey = isXKeyed ? undefined : "value";

  // For x-keyed data, detect series keys
  const seriesKeys: string[] = [];
  if (isXKeyed && data.length > 0) {
    for (const k of Object.keys(data[0])) {
      if (k !== "x") seriesKeys.push(k);
    }
  }

  const COLORS = ["#7c3aed", "#6366f1", "#a78bfa"];

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <ChartHeader title={title} eventLabel={eventLabel} queryInfo={queryInfo} />

      <ResponsiveContainer width="100%" height={300}>
        {chartType === "bar" ? (
          <BarChart data={data as Record<string, unknown>[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey={xKey}
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
            {valueKey ? (
              <Bar
                dataKey="value"
                fill="#7c3aed"
                radius={[4, 4, 0, 0]}
              />
            ) : (
              seriesKeys.map((sk, i) => (
                <Bar
                  key={sk}
                  dataKey={sk}
                  fill={COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))
            )}
          </BarChart>
        ) : (
          <LineChart data={data as Record<string, unknown>[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey={xKey}
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
            {valueKey ? (
              <Line
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ) : (
              seriesKeys.map((sk, i) => (
                <Line
                  key={sk}
                  dataKey={sk}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
