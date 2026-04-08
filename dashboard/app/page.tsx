"use client";

import { MixpanelAuthProvider } from "@/contexts/MixpanelAuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalysisTabs from "@/components/dashboard/AnalysisTabs";

export default function Home() {
  return (
    <MixpanelAuthProvider>
      <div className="min-h-screen bg-slate-950">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-6 py-6">
          <AnalysisTabs />
        </main>
      </div>
    </MixpanelAuthProvider>
  );
}
