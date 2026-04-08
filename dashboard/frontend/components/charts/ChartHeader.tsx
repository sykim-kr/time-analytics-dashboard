"use client";

import type { ChartQueryInfo } from "@/lib/types";

type Props = {
  title: string;
  eventLabel?: string;
  queryInfo?: ChartQueryInfo;
};

export default function ChartHeader({ title, eventLabel, queryInfo }: Props) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {eventLabel && (
        <p className="text-xs text-purple-400">{eventLabel}</p>
      )}
      {queryInfo && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
              <span className="text-slate-400">Breakdown:</span>
              <span className="text-amber-300 font-medium">{queryInfo.breakdown}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
