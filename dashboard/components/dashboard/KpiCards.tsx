"use client";

type Metric = {
  label: string;
  value: string | number;
  change?: string;
};

type KpiCardsProps = {
  metrics: Metric[];
  eventLabels?: Record<string, string>;
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

export default function KpiCards({ metrics, eventLabels }: KpiCardsProps) {
  const displayMetrics = metrics.slice(0, 4);

  return (
    <div className="grid grid-cols-4 gap-4">
      {displayMetrics.map((metric, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-700 bg-slate-800 p-5"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-slate-400">
              {metric.label}
            </span>
            {eventLabels?.[metric.label] && (
              <span className="text-xs text-purple-400">
                {eventLabels[metric.label]}
              </span>
            )}
          </div>
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
  );
}
