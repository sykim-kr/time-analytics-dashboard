"use client";

import { useState, useCallback, useEffect } from "react";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { useNLQuery } from "@/hooks/useNLQuery";
import ExampleQuestions from "./ExampleQuestions";
import QueryInput from "./QueryInput";
import QueryResult from "./QueryResult";
import type { AnalysisTabKey } from "@/lib/nlquery-config";

type Props = {
  tab: AnalysisTabKey;
};

export default function NLQueryPanel({ tab }: Props) {
  const { selectedProject, nlSessionToken, setNlSessionToken } = useMixpanelAuth();
  const { state, status, result, error, authenticate, query, reset } = useNLQuery();
  const [input, setInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Auto-authenticate with NL query server when project is selected
  const ensureAuth = useCallback(async (): Promise<string | null> => {
    if (nlSessionToken) return nlSessionToken;

    setAuthError(null);
    // We need to get credentials from the cookie — but we can't access httpOnly cookies.
    // Instead, we'll proxy through our backend or ask user to re-enter.
    // For now, we'll try to use the existing cookie session via our backend proxy.
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://time-analytics-dashboard-production.up.railway.app/api"}/nl-auth`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.sessionToken) {
          setNlSessionToken(data.sessionToken);
          return data.sessionToken;
        }
      }
    } catch {
      // Backend proxy not available, try direct auth (will need credentials)
    }

    setAuthError("NL Query 서버 인증이 필요합니다. 로그아웃 후 다시 로그인해 주세요.");
    return null;
  }, [nlSessionToken, setNlSessionToken]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !selectedProject) return;

    const token = await ensureAuth();
    if (!token) return;

    query(input.trim(), String(selectedProject.id), token);
  }, [input, selectedProject, ensureAuth, query]);

  const handleExampleSelect = (question: string) => {
    setInput(question);
  };

  if (!selectedProject) return null;

  return (
    <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💬</span>
        <h3 className="text-sm font-semibold text-slate-100">AI 추가 분석</h3>
        <span className="text-xs text-slate-500">| Mixpanel 데이터를 자연어로 분석하세요</span>
      </div>

      <ExampleQuestions tab={tab} onSelect={handleExampleSelect} />

      <QueryInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        loading={state === "streaming" || state === "authenticating"}
      />

      {authError && (
        <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-xs text-yellow-400">
          {authError}
        </div>
      )}

      <QueryResult
        status={status}
        result={result}
        error={error}
        loading={state === "streaming"}
      />

      {state === "done" && result && (
        <button
          onClick={() => { reset(); setInput(""); }}
          className="mt-3 text-xs text-slate-500 hover:text-slate-400"
        >
          새 질문하기
        </button>
      )}
    </div>
  );
}
