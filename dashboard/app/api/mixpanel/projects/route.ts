import { NextResponse } from "next/server";
import { getTokenFromCookies } from "@/lib/mixpanel/auth";
import type { MixpanelProject } from "@/lib/types";

export async function GET() {
  const token = await getTokenFromCookies();
  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated", code: "auth_expired" },
      { status: 401 }
    );
  }

  const projects: MixpanelProject[] = [
    { id: 1, name: "My App Production" },
    { id: 2, name: "Staging" },
    { id: 3, name: "Marketing Site" },
  ];

  return NextResponse.json({ projects });
}
