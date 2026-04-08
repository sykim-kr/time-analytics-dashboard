"use client";

import type { ReactNode } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import WarningBanner from "./WarningBanner";

type TabContentProps = {
  status: "ok" | "partial" | "empty" | "error" | "loading";
  children: ReactNode;
  requiredEvents?: string[];
  warnings?: string[];
  error?: string;
};

export default function TabContent({
  status,
  children,
  requiredEvents,
  warnings,
  error,
}: TabContentProps) {
  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  if (status === "empty") {
    return (
      <EmptyState
        message="분석할 데이터가 없습니다"
        requiredEvents={requiredEvents}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl">&#10060;</span>
        <p className="mt-4 text-red-400">{error ?? "오류가 발생했습니다"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (status === "partial") {
    return (
      <div className="space-y-4">
        {warnings && <WarningBanner warnings={warnings} />}
        {children}
      </div>
    );
  }

  // status === "ok"
  return <>{children}</>;
}
