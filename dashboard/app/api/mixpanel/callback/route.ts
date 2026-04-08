import { NextResponse } from "next/server";

export async function GET() {
  // Mock mode: auth/route.ts handles everything
  // Real mode (Phase 2): validate state, exchange code for token
  return NextResponse.redirect(
    new URL("/", process.env.MIXPANEL_REDIRECT_URI || "http://localhost:3000")
  );
}
