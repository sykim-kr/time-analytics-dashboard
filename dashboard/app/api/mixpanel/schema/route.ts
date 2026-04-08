import { NextResponse } from "next/server";
import type { SchemaResponse } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId required", code: "invalid_params" },
      { status: 400 },
    );
  }

  const schema: SchemaResponse = {
    events: [
      { name: "App Open", properties: [{ name: "platform", type: "string" }, { name: "version", type: "string" }] },
      { name: "Page View", properties: [{ name: "page_name", type: "string" }, { name: "referrer", type: "string" }] },
      { name: "Sign Up", properties: [{ name: "method", type: "string" }] },
      { name: "Purchase", properties: [{ name: "amount", type: "number" }, { name: "product_id", type: "string" }, { name: "campaign", type: "string" }] },
      { name: "Add to Cart", properties: [{ name: "product_id", type: "string" }, { name: "quantity", type: "number" }] },
      { name: "Session Start", properties: [{ name: "device", type: "string" }] },
      { name: "Search", properties: [{ name: "query", type: "string" }] },
      { name: "Content View", properties: [{ name: "content_id", type: "string" }, { name: "category", type: "string" }] },
    ],
    userProperties: [
      { name: "email", type: "string" },
      { name: "plan", type: "string" },
      { name: "signup_date", type: "datetime" },
    ],
  };

  return NextResponse.json(schema);
}
