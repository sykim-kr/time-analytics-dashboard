"use client";

import React from "react";

type Props = {
  data: { x: string; y: string; value: number }[];
  title: string;
  xLabels: string[];
  yLabels: string[];
  eventLabel?: string;
};

function getColor(value: number, min: number, max: number): string {
  if (max === min) return "#1e1b4b";
  const ratio = (value - min) / (max - min);
  // Interpolate from dark indigo (#1e1b4b) to bright purple (#8b5cf6)
  const r = Math.round(30 + ratio * (139 - 30));
  const g = Math.round(27 + ratio * (92 - 27));
  const b = Math.round(75 + ratio * (246 - 75));
  return `rgb(${r},${g},${b})`;
}

export default function HeatmapChart({
  data,
  title,
  xLabels,
  yLabels,
  eventLabel,
}: Props) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Build lookup map
  const lookup = new Map<string, number>();
  for (const d of data) {
    lookup.set(`${d.y}__${d.x}`, d.value);
  }

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {eventLabel && (
        <p className="text-xs text-purple-400 mb-3">{eventLabel}</p>
      )}
      {!eventLabel && <div className="mb-3" />}

      <div
        className="gap-1"
        style={{
          display: "grid",
          gridTemplateColumns: `auto repeat(${xLabels.length}, 1fr)`,
        }}
      >
        {/* Top-left empty cell */}
        <div />
        {/* X-axis labels */}
        {xLabels.map((xl) => (
          <div
            key={xl}
            className="text-xs text-slate-400 text-center truncate"
          >
            {xl}
          </div>
        ))}

        {/* Rows */}
        {yLabels.map((yl) => (
          <React.Fragment key={yl}>
            <div
              className="text-xs text-slate-400 pr-2 flex items-center"
            >
              {yl}
            </div>
            {xLabels.map((xl) => {
              const v = lookup.get(`${yl}__${xl}`) ?? 0;
              return (
                <div
                  key={`${yl}-${xl}`}
                  className="rounded-sm h-6"
                  style={{ backgroundColor: getColor(v, min, max) }}
                  title={`${yl}, ${xl}: ${v}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
