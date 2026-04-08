import { NextResponse } from "next/server";
import { analysisQuerySchema } from "@/lib/mixpanel/validation";
import { getMockData } from "@/lib/mock/lifecycle";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  const parsed = analysisQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", code: "invalid_params", details: parsed.error.message },
      { status: 400 },
    );
  }

  const data = getMockData(parsed.data.projectId);
  return NextResponse.json(data);
}
