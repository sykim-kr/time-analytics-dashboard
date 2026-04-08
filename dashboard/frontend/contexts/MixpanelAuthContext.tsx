"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";
import type { AuthState, MixpanelProject } from "@/lib/types";

type MixpanelAuthContextType = {
  authState: AuthState;
  projects: MixpanelProject[];
  selectedProject: MixpanelProject | null;
  error: string | null;
  availableEvents: string[];
  connect: () => void;
  logout: () => Promise<void>;
  selectProject: (project: MixpanelProject) => Promise<void>;
};

const MixpanelAuthContext = createContext<MixpanelAuthContextType | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export function MixpanelAuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [projects, setProjects] = useState<MixpanelProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<MixpanelProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);

  const checkAuth = useCallback(async () => {
    try {
      setAuthState("loading_projects");
      const res = await fetch(`${API_URL}/projects`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        setAuthState("authenticated");
      } else {
        setAuthState("idle");
      }
    } catch {
      setAuthState("idle");
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const connect = useCallback(() => {
    setAuthState("authenticating");
    window.location.href = `${API_URL}/auth`;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
    setAuthState("idle");
    setProjects([]);
    setSelectedProject(null);
    setAvailableEvents([]);
    setError(null);
    queryClient.clear();
  }, []);

  const selectProject = useCallback(async (project: MixpanelProject) => {
    setSelectedProject(project);
    setAuthState("loading_analysis");
    try {
      const res = await fetch(`${API_URL}/schema?projectId=${project.id}`, { credentials: "include" });
      if (res.ok) {
        const schema = await res.json();
        setAvailableEvents(schema.events.map((e: { name: string }) => e.name));
      }
      setAuthState("project_selected");
    } catch {
      setError("Failed to load project schema.");
      setAuthState("error");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MixpanelAuthContext.Provider
        value={{
          authState,
          projects,
          selectedProject,
          error,
          availableEvents,
          connect,
          logout,
          selectProject,
        }}
      >
        {children}
      </MixpanelAuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useMixpanelAuth() {
  const context = useContext(MixpanelAuthContext);
  if (!context) {
    throw new Error("useMixpanelAuth must be used within MixpanelAuthProvider");
  }
  return context;
}
