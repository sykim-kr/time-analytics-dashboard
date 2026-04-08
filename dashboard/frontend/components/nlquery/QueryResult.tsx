"use client";

import { useState } from "react";
import type { NLQueryResult, NLQueryStatus } from "@/lib/nlquery-config";

type Props = {
  status: NLQueryStatus | null;
  result: NLQueryResult | null;
  error: string | null;
  loading: boolean;
};

export default function QueryResult({ status, result, error, loading }: Props) {
  const [showMeta, setShowMeta] = useState(false);

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (loading && status) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-purple-400">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>{status.message}</span>
        {status.tool && (
          <span className="px-2 py-0.5 bg-purple-900/30 rounded text-xs text-purple-300">
            {status.tool}
          </span>
        )}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Answer */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {result.answer}
        </p>
      </div>

      {/* Chart */}
      {result.chart && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-400 mb-2">
            {result.chart.type === "line" ? "Line Chart" : "Bar Chart"}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1 pr-4 text-slate-400">Label</th>
                  {result.chart.datasets.map((ds) => (
                    <th key={ds.label} className="text-right py-1 px-2 text-slate-400">
                      {ds.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.chart.labels.map((label, i) => (
                  <tr key={label} className="border-b border-slate-700/50">
                    <td className="py-1 pr-4 text-slate-300">{label}</td>
                    {result.chart!.datasets.map((ds) => (
                      <td key={ds.label} className="text-right py-1 px-2">
                        {typeof ds.data[i] === "number" ? ds.data[i].toLocaleString() : ds.data[i]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Table */}
      {result.table && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-600">
                {result.table.columns.map((col) => (
                  <th key={col} className="text-left py-2 px-3 text-slate-400 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.table.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 px-3">
                      {typeof cell === "number" ? cell.toLocaleString() : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.table.totalRows && result.table.totalRows > result.table.rows.length && (
            <p className="text-xs text-slate-500 mt-2">
              {result.table.totalRows.toLocaleString()}건 중 {result.table.rows.length}건 표시
            </p>
          )}
        </div>
      )}

      {/* Metadata (collapsible) */}
      {result.metadata && (
        <div>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
          >
            <span>{showMeta ? "▾" : "▸"}</span>
            분석 상세정보
          </button>
          {showMeta && (
            <div className="mt-2 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-400 space-y-1">
              {result.metadata.dateRange && <p>기간: {result.metadata.dateRange}</p>}
              {result.metadata.dimensions?.length ? (
                <p>차원: {result.metadata.dimensions.join(", ")}</p>
              ) : null}
              {result.metadata.metrics?.length ? (
                <p>지표: {result.metadata.metrics.join(", ")}</p>
              ) : null}
              {result.metadata.toolCalls?.length ? (
                <p>API 호출: {result.metadata.toolCalls.join(", ")}</p>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
