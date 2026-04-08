import { NextResponse } from "next/server";
import { setTokenCookie, isMockMode } from "@/lib/mixpanel/auth";

export async function GET() {
  if (isMockMode()) {
    await setTokenCookie("mock_token_" + Date.now());
    return NextResponse.redirect(
      new URL("/", process.env.MIXPANEL_REDIRECT_URI || "http://localhost:3000")
    );
  }

  // Real OAuth flow (Phase 2)
  // const state = crypto.randomUUID();
  // Set state cookie, redirect to Mixpanel OAuth URL
  return NextResponse.json(
    { error: "Real OAuth not implemented yet" },
    { status: 501 }
  );
}
