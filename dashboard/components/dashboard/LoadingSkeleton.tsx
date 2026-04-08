"use client";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI card placeholders */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-700 bg-slate-800"
          />
        ))}
      </div>

      {/* Chart area placeholders */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-slate-700 bg-slate-800"
          />
        ))}
      </div>

      {/* Insight area placeholder */}
      <div className="h-32 animate-pulse rounded-xl border border-slate-700 bg-slate-800" />
    </div>
  );
}
