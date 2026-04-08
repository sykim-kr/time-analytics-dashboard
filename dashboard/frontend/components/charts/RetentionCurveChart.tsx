"use client";

import { useMemo } from "react";
import ChartHeader from "./ChartHeader";
import type { ChartQueryInfo } from "@/lib/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  data: { x: string; [series: string]: number | string }[];
  title: string;
  eventLabel?: string;
  queryInfo?: ChartQueryInfo;
};

const PALETTE = ["#7c3aed", "#6366f1", "#a78bfa"];

export default function RetentionCurveChart({
  data,
  title,
  eventLabel,
  queryInfo,
}: Props) {
  const seriesKeys = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((k) => k !== "x");
  }, [data]);

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <ChartHeader title={title} eventLabel={eventLabel} queryInfo={queryInfo} />

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="x"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: 8,
              color: "#fff",
            }}
            formatter={(v) => `${v}%`}
          />
          <Legend />

          {/* Area fill for first series */}
          {seriesKeys.length > 0 && (
            <Area
              dataKey={seriesKeys[0]}
              stroke="none"
              fill={PALETTE[0]}
              fillOpacity={0.1}
            />
          )}

          {seriesKeys.map((sk, i) => (
            <Line
              key={sk}
              dataKey={sk}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
