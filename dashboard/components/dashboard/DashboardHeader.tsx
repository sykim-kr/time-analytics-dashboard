"use client";

import ConnectMixpanelButton from "@/components/auth/ConnectMixpanelButton";
import ProjectSelector from "@/components/auth/ProjectSelector";

type DashboardHeaderProps = {
  onRefresh?: () => void;
};

export default function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4">
      <h1 className="text-lg font-bold text-slate-100">
        <span className="mr-1">&#9201;</span>
        시간 기반 분석
      </h1>

      <div className="flex items-center gap-4">
        <ConnectMixpanelButton />
        <ProjectSelector />
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            title="새로고침"
          >
            <span>&#128260;</span>
          </button>
        )}
      </div>
    </header>
  );
}
