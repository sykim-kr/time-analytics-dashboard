"use client";

import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";

export default function ConnectMixpanelButton() {
  const { authState, connect, logout, error } = useMixpanelAuth();

  if (
    authState === "authenticated" ||
    authState === "project_selected" ||
    authState === "ready" ||
    authState === "loading_analysis"
  ) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-3 py-1 text-xs font-medium text-green-400 border border-green-700/50">
          <span>&#10003;</span> 연결됨
        </span>
        <button
          onClick={logout}
          className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  if (authState === "authenticating" || authState === "loading_projects") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600/50 px-4 py-2 text-sm font-medium text-purple-200 cursor-not-allowed"
      >
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        인증 중...
      </button>
    );
  }

  if (authState === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">{error ?? "인증 오류"}</span>
        <button
          onClick={connect}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // idle
  return (
    <button
      onClick={connect}
      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
    >
      <span>&#128279;</span>
      Mixpanel 인증하기
    </button>
  );
}
