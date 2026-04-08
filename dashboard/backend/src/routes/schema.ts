import { Router } from "express";
import { requireAuth, isMockMode } from "../middleware/auth";
import { createMixpanelClient } from "../lib/mixpanel-client";
import type { SchemaResponse } from "../types";

const router = Router();

const MOCK_SCHEMA: SchemaResponse = {
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

router.get("/schema", requireAuth, async (req, res) => {
  const projectId = req.query.projectId;
  if (!projectId) {
    res.status(400).json({ error: "projectId required", code: "invalid_params" });
    return;
  }

  if (isMockMode()) {
    res.json(MOCK_SCHEMA);
    return;
  }

  try {
    const credentials = (req as any).mixpanelCredentials;
    const client = createMixpanelClient(credentials.username, credentials.secret);
    const eventNames = await client.getEvents(Number(projectId));

    // Transform event name strings to SchemaResponse format
    const events = eventNames
      .filter((name: string) => !name.startsWith("$mp_")) // Filter internal events
      .map((name: string) => ({ name, properties: [] }));

    const schema: SchemaResponse = { events, userProperties: [] };
    res.json(schema);
  } catch (error: any) {
    console.error("Schema fetch error:", error.message);
    // Fallback to mock schema on error
    res.json(MOCK_SCHEMA);
  }
});

export default router;
