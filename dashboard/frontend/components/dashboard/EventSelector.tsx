"use client";

import { useState, useEffect, useRef } from "react";
import type { EventSlot } from "@/lib/types";

type EventSelectorProps = {
  slots: EventSlot[];
  availableEvents: string[];
  onChange: (selections: Record<string, string>) => void;
  variant?: "default" | "funnel";
  loading?: boolean;
};

const ANY_EVENT = "$any_event";
const ANY_EVENT_LABEL = "Any Event (전체)";

function initSelections(
  slots: EventSlot[],
  availableEvents: string[]
): Record<string, string> {
  const initial: Record<string, string> = {};
  const allEvents = [ANY_EVENT, ...availableEvents];
  for (const slot of slots) {
    if (slot.value) {
      initial[slot.key] = slot.value;
    } else {
      const match = slot.defaultCandidates.find((c) =>
        allEvents.includes(c)
      );
      initial[slot.key] = match || availableEvents[0] || "";
    }
  }
  return initial;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-purple-400">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-xs">데이터 조회 중...</span>
    </div>
  );
}

export function EventSelector({
  slots,
  availableEvents,
  onChange,
  variant = "default",
  loading = false,
}: EventSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    initSelections(slots, availableEvents)
  );
  const prevEventsRef = useRef<string[] | null>(null);

  useEffect(() => {
    if (availableEvents.length === 0) return;
    if (prevEventsRef.current === availableEvents) return;
    prevEventsRef.current = availableEvents;

    const newSelections = initSelections(slots, availableEvents);
    setSelections(newSelections);
    onChange(newSelections);
  }, [availableEvents, slots, onChange]);

  const handleChange = (key: string, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onChange(selections);
  };

  if (variant === "funnel") {
    return (
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-100">
            🎯 퍼널 이벤트 설정
          </span>
          <div className="flex items-center gap-3">
            {loading && <LoadingSpinner />}
            {!loading && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                자동 매핑됨 — 변경 가능
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {slots.map((slot, index) => (
            <div key={slot.key} className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
                <span className="text-xs text-slate-400">{slot.label}</span>
                <select
                  value={selections[slot.key] ?? ""}
                  onChange={(e) => handleChange(slot.key, e.target.value)}
                  disabled={loading}
                  className="bg-transparent text-purple-400 text-sm font-medium outline-none cursor-pointer disabled:opacity-50"
                >
                  {availableEvents.length === 0 ? (
                    <option value="">이벤트 없음</option>
                  ) : (
                    <>
                      <option value={ANY_EVENT}>{ANY_EVENT_LABEL}</option>
                      {availableEvents.map((ev) => (
                        <option key={ev} value={ev}>
                          {ev}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              {index < slots.length - 1 && (
                <span className="text-slate-500 select-none">→</span>
              )}
            </div>
          ))}

          <button
            type="button"
            disabled
            className="border border-dashed border-slate-600 text-purple-400 text-sm rounded-lg px-3 py-2 opacity-60 cursor-not-allowed"
          >
            + 단계 추가
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className="ml-auto bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          >
            {loading ? "조회 중..." : "적용"}
          </button>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-100">
          🎯 분석 이벤트 설정
        </span>
        <div className="flex items-center gap-3">
          {loading && <LoadingSpinner />}
          {!loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              자동 매핑됨 — 변경 가능
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {slots.map((slot) => (
          <div
            key={slot.key}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 flex flex-col gap-0.5"
          >
            <span className="text-xs text-slate-400">{slot.label}</span>
            <select
              value={selections[slot.key] ?? ""}
              onChange={(e) => handleChange(slot.key, e.target.value)}
              disabled={loading}
              className="bg-transparent text-purple-400 text-sm font-medium outline-none cursor-pointer disabled:opacity-50"
            >
              {availableEvents.length === 0 ? (
                <option value="">이벤트 없음</option>
              ) : (
                <>
                  <option value={ANY_EVENT}>{ANY_EVENT_LABEL}</option>
                  {availableEvents.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        ))}

        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="ml-auto bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
        >
          {loading ? "조회 중..." : "적용"}
        </button>
      </div>
    </div>
  );
}
