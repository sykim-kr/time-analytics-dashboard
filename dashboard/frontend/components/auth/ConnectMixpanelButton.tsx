"use client";

import { useState } from "react";
import { useMixpanelAuth } from "@/contexts/MixpanelAuthContext";
import { API_URL } from "@/lib/api";

export default function ConnectMixpanelButton() {
  const { authState, connect, logout } = useMixpanelAuth();
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "인증에 실패했습니다.");
        return;
      }
      setShowModal(false);
      setUsername("");
      setSecret("");
      connect();
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (
    authState === "authenticated" ||
    authState === "project_selected" ||
    authState === "loading_analysis" ||
    authState === "ready" ||
    authState === "loading_projects"
  ) {
    return (
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-green-900/50 border border-green-700 rounded-full text-xs text-green-400 font-medium">
          ✓ 연결됨
        </span>
        <button
          onClick={logout}
          className="text-xs text-slate-400 hover:text-slate-200 underline"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        🔗 Mixpanel 인증하기
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">
              Mixpanel 연결
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Service Account 자격 증명을 입력하세요.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Service Account Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Service Account Secret
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="secret"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? "연결 중..." : "연결"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
