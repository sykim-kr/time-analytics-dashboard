"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  data: { label: string; value: number }[];
  title: string;
  eventLabel?: string;
};

export default function FunnelLagChart({
  data,
  title,
  eventLabel,
}: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {eventLabel && (
        <p className="text-xs text-purple-400 mb-3">{eventLabel}</p>
      )}
      {!eventLabel && <div className="mb-3" />}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: 8,
              color: "#fff",
            }}
          />
          <Bar
            dataKey="value"
            fill="#8b5cf6"
            barSize={24}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
