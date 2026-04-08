"use client";

import type { ChartQueryInfo } from "@/lib/types";

type Metric = {
  label: string;
  value: string | number;
  change?: string;
};

type KpiCardsProps = {
  metrics: Metric[];
  queryInfo?: ChartQueryInfo;
};

function ChangeIndicator({ change }: { change: string }) {
  const isPositive = change.startsWith("+") || (!change.startsWith("-") && parseFloat(change) > 0);
  const isNegative = change.startsWith("-");

  if (isPositive) {
    return <span className="text-sm text-green-400">&#9650; {change}</span>;
  }
  if (isNegative) {
    return <span className="text-sm text-red-400">&#9660; {change}</span>;
  }
  return <span className="text-sm text-slate-400">{change}</span>;
}

export function KpiCards({ metrics, queryInfo }: KpiCardsProps) {
  const displayMetrics = metrics.slice(0, 4);

  return (
    <div>
      {/* Query metadata header */}
      {queryInfo && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">KPI 기준</span>
          {queryInfo.events.map((ev) => (
            <span
              key={ev.label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/80 text-[11px]"
            >
              <span className="text-slate-400">{ev.label}:</span>
              <span className="text-purple-300 font-medium">{ev.value}</span>
            </span>
          ))}
          {queryInfo.period && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/80 text-[11px]">
              <span className="text-slate-400">기간:</span>
              <span className="text-emerald-300 font-medium">{queryInfo.period}</span>
            </span>
          )}
          {queryInfo.breakdown && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/80 text-[11px]">
              <span className="text-slate-400">Measure:</span>
              <span className="text-amber-300 font-medium">{queryInfo.breakdown}</span>
            </span>
          )}
        </div>
      )}

      {/* KPI cards grid */}
      <div className="grid grid-cols-4 gap-4">
        {displayMetrics.map((metric, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-700 bg-slate-800 p-5"
          >
            <span className="text-xs uppercase text-slate-400">
              {metric.label}
            </span>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              {metric.value}
            </div>
            {metric.change && (
              <div className="mt-1">
                <ChangeIndicator change={metric.change} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
