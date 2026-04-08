"use client";

import { useState, useCallback, useRef } from "react";
import { API_URL } from "@/lib/api";
import type { NLQueryResult, NLQueryStatus } from "@/lib/nlquery-config";

type QueryState = "idle" | "authenticating" | "streaming" | "done" | "error";

export function useNLQuery() {
  const [state, setState] = useState<QueryState>("idle");
  const [status, setStatus] = useState<NLQueryStatus | null>(null);
  const [result, setResult] = useState<NLQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  const query = useCallback(
    async (
      question: string,
      projectId: string,
      sessionToken: string
    ) => {
      setState("streaming");
      setStatus(null);
      setResult(null);
      setError(null);
      doneRef.current = false;

      try {
        // Use our backend proxy to avoid CORS issues
        const res = await fetch(`${API_URL}/nl-query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            question,
            projectId,
            sessionToken,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error((errData as any).error || `서버 오류 (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);
                if (eventType === "status") {
                  setStatus(data as NLQueryStatus);
                } else if (eventType === "result") {
                  setResult(data as NLQueryResult);
                  doneRef.current = true;
                  setState("done");
                } else if (eventType === "error") {
                  throw new Error(data.error || "분석 중 오류가 발생했습니다.");
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }

        if (!doneRef.current) {
          setState("done");
        }
      } catch (e: any) {
        setError(e.message || "알 수 없는 오류");
        setState("error");
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState("idle");
    setStatus(null);
    setResult(null);
    setError(null);
    doneRef.current = false;
  }, []);

  return { state, status, result, error, query, reset };
}
