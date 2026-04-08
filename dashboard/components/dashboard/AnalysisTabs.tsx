"use client";

import { useState } from "react";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";

const TABS = [
  { id: "calendar", label: "Calendar Time", icon: "\uD83D\uDCC5" },
  { id: "timetox", label: "Time-to-X", icon: "\u23F1" },
  { id: "retention", label: "\uCF54\uD638\uD2B8 & \uB9AC\uD150\uC158", icon: "\uD83D\uDCCA" },
  { id: "velocity", label: "Velocity / Lag", icon: "\uD83D\uDE80" },
  { id: "lifecycle", label: "Lifecycle", icon: "\uD83D\uDD04" },
  { id: "context", label: "External Context", icon: "\uD83C\uDF0D" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalysisTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const { authState } = useMixpanelAuth();

  const isReady =
    authState === "project_selected" ||
    authState === "ready" ||
    authState === "loading_analysis";

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-slate-400">
          Mixpanel에 연결하고 프로젝트를 선택하면 분석 탭이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-slate-700 bg-slate-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm transition-colors ${
                isActive
                  ? "border-b-2 border-purple-500 font-semibold text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content placeholder */}
      <div className="flex-1 p-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
          <p className="text-sm text-slate-400">
            Active tab: <span className="font-mono text-purple-400">{activeTab}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
