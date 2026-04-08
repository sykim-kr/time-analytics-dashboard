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

    // Fetch top events sorted by volume (most popular first)
    const topEvents = await client.getTopEvents(Number(projectId));

    let events: SchemaResponse["events"];

    if (topEvents.length > 0) {
      // Sort by volume descending — highest volume event first
      const sorted = topEvents.sort((a, b) => b.amount - a.amount);
      events = sorted.map((e) => ({ name: e.event, properties: [] }));

      // Also fetch all event names to include events not in top list
      try {
        const allNames = await client.getEvents(Number(projectId));
        const topSet = new Set(sorted.map((e) => e.event));
        const remaining = allNames
          .filter((name: string) => !name.startsWith("$mp_") && !topSet.has(name));
        for (const name of remaining) {
          events.push({ name, properties: [] });
        }
      } catch {
        // If fetching all names fails, just use top events
      }
    } else {
      // Fallback to alphabetical event names
      const eventNames = await client.getEvents(Number(projectId));
      events = eventNames
        .filter((name: string) => !name.startsWith("$mp_"))
        .map((name: string) => ({ name, properties: [] }));
    }

    const schema: SchemaResponse = { events, userProperties: [] };
    res.json(schema);
  } catch (error: any) {
    console.error("Schema fetch error:", error.message);
    res.json(MOCK_SCHEMA);
  }
});

export default router;
