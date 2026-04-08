"use client";

import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";

export default function ProjectSelector() {
  const { authState, projects, selectedProject, selectProject } =
    useMixpanelAuth();

  if (authState === "idle" || authState === "authenticating") {
    return null;
  }

  if (authState === "loading_projects") {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
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
        프로젝트 로딩 중...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-400">프로젝트:</label>
      <select
        value={selectedProject?.id ?? ""}
        onChange={(e) => {
          const project = projects.find(
            (p) => p.id === Number(e.target.value)
          );
          if (project) selectProject(project);
        }}
        className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        <option value="" disabled>
          프로젝트 선택
        </option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
