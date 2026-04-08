"use client";

type InsightListProps = {
  insights: string[];
};

export function InsightList({ insights }: InsightListProps) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-200">
        <span className="mr-1">&#128161;</span>
        핵심 인사이트
      </h3>
      <ul className="mt-3 space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 text-xs text-purple-500">&#9679;</span>
            <span className="text-sm text-slate-300">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
