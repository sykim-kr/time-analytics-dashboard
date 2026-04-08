"use client";

import { useState, useEffect, useRef } from "react";
import type { EventSlot } from "@/lib/types";

type EventSelectorProps = {
  slots: EventSlot[];
  availableEvents: string[];
  onChange: (selections: Record<string, string>) => void;
  variant?: "default" | "funnel";
};

function initSelections(
  slots: EventSlot[],
  availableEvents: string[]
): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const slot of slots) {
    if (slot.value) {
      initial[slot.key] = slot.value;
    } else {
      const match = slot.defaultCandidates.find((c) =>
        availableEvents.includes(c)
      );
      initial[slot.key] = match || availableEvents[0] || "";
    }
  }
  return initial;
}

export function EventSelector({
  slots,
  availableEvents,
  onChange,
  variant = "default",
}: EventSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    initSelections(slots, availableEvents)
  );
  const prevEventsRef = useRef<string[] | null>(null);

  // Auto-apply on mount and re-initialize when availableEvents change
  useEffect(() => {
    if (availableEvents.length === 0) return;
    // Skip if same events array (no change)
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
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-100">
            🎯 퍼널 이벤트 설정
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            자동 매핑됨 — 변경 가능
          </span>
        </div>

        {/* Funnel steps */}
        <div className="flex flex-wrap items-center gap-2">
          {slots.map((slot, index) => (
            <div key={slot.key} className="flex items-center gap-2">
              {/* Step */}
              <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 flex items-center gap-2">
                {/* Numbered badge */}
                <span className="bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
                {/* Label */}
                <span className="text-xs text-slate-400">{slot.label}</span>
                {/* Select */}
                <select
                  value={selections[slot.key] ?? ""}
                  onChange={(e) => handleChange(slot.key, e.target.value)}
                  className="bg-transparent text-purple-400 text-sm font-medium outline-none cursor-pointer"
                >
                  {availableEvents.length === 0 ? (
                    <option value="">이벤트 없음</option>
                  ) : (
                    availableEvents.map((ev) => (
                      <option key={ev} value={ev}>
                        {ev}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Arrow between steps (not after last) */}
              {index < slots.length - 1 && (
                <span className="text-slate-500 select-none">→</span>
              )}
            </div>
          ))}

          {/* Add step placeholder */}
          <button
            type="button"
            disabled
            className="border border-dashed border-slate-600 text-purple-400 text-sm rounded-lg px-3 py-2 opacity-60 cursor-not-allowed"
          >
            + 단계 추가
          </button>

          {/* Apply */}
          <button
            type="button"
            onClick={handleApply}
            className="ml-auto bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          >
            적용
          </button>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-100">
          🎯 분석 이벤트 설정
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          자동 매핑됨 — 변경 가능
        </span>
      </div>

      {/* Slots + Apply */}
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
              className="bg-transparent text-purple-400 text-sm font-medium outline-none cursor-pointer"
            >
              {availableEvents.length === 0 ? (
                <option value="">이벤트 없음</option>
              ) : (
                availableEvents.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))
              )}
            </select>
          </div>
        ))}

        <button
          type="button"
          onClick={handleApply}
          className="ml-auto bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
        >
          적용
        </button>
      </div>
    </div>
  );
}
