import { Router } from "express";
import { requireAuth, isMockMode } from "../middleware/auth";
import { analysisQuerySchema } from "../lib/validation";
import { createMixpanelClient } from "../lib/mixpanel-client";
import { getMockData as getCalendar } from "../lib/mock/calendar";
import { getMockData as getTimetox } from "../lib/mock/timetox";
import { getMockData as getRetention } from "../lib/mock/retention";
import { getMockData as getVelocity } from "../lib/mock/velocity";
import { getMockData as getLifecycle } from "../lib/mock/lifecycle";
import { getMockData as getContext } from "../lib/mock/context";
import { analyzeCalendar } from "../lib/analysis/calendar";
import { analyzeTimeToX } from "../lib/analysis/timetox";
import { analyzeRetention } from "../lib/analysis/retention";
import { analyzeVelocity } from "../lib/analysis/velocity";
import { analyzeLifecycle } from "../lib/analysis/lifecycle";
import { analyzeContext } from "../lib/analysis/context";

const router = Router();

const mockHandlers: Record<string, (projectId: number) => unknown> = {
  calendar: getCalendar,
  timetox: getTimetox,
  retention: getRetention,
  velocity: getVelocity,
  lifecycle: getLifecycle,
  context: getContext,
};

function getDateRange(period: string): { fromDate: string; toDate: string } {
  const to = new Date();
  const from = new Date();
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  from.setDate(from.getDate() - days);
  return {
    fromDate: from.toISOString().split("T")[0],
    toDate: to.toISOString().split("T")[0],
  };
}

function parseEventParams(query: Record<string, any>): Record<string, string> {
  const events: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith("events.") && typeof value === "string") {
      events[key.replace("events.", "")] = value;
    }
  }
  return events;
}

router.get("/analysis/:type", requireAuth, async (req, res) => {
  const type = req.params.type as string;
  const validTypes = ["calendar", "timetox", "retention", "velocity", "lifecycle", "context"];

  if (!validTypes.includes(type)) {
    res.status(404).json({ error: `Unknown analysis type: ${type}`, code: "not_found" });
    return;
  }

  const parsed = analysisQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid parameters", code: "invalid_params", details: parsed.error.message });
    return;
  }

  // Use mock data if USE_MOCK is set
  if (isMockMode()) {
    const handler = mockHandlers[type];
    res.json(handler(parsed.data.projectId));
    return;
  }

  // Real Mixpanel API integration
  const credentials = (req as any).mixpanelCredentials;
  const client = createMixpanelClient(credentials.username, credentials.secret);
  const { fromDate, toDate } = parsed.data.from && parsed.data.to
    ? { fromDate: parsed.data.from, toDate: parsed.data.to }
    : getDateRange(parsed.data.period);
  const eventParams = parseEventParams(req.query as Record<string, any>);

  try {
    let result: any;

    switch (type) {
      case "calendar":
        result = await analyzeCalendar(client, parsed.data.projectId, {
          primary: eventParams.primary || "App Open",
          conversion: eventParams.conversion || "Purchase",
          exploration: eventParams.exploration || "Page View",
        }, fromDate, toDate);
        break;

      case "timetox":
        result = await analyzeTimeToX(client, parsed.data.projectId, {
          start: eventParams.start || "Sign Up",
          middle: eventParams.middle,
          end: eventParams.end || "Purchase",
        }, fromDate, toDate);
        break;

      case "retention":
        result = await analyzeRetention(client, parsed.data.projectId, {
          cohortEvent: eventParams.cohortEvent || "Sign Up",
          retentionEvent: eventParams.retentionEvent || "App Open",
        }, fromDate, toDate);
        break;

      case "velocity":
        result = await analyzeVelocity(client, parsed.data.projectId, {
          frequency: eventParams.frequency || "App Open",
          session: eventParams.session || "Session Start",
          conversion: eventParams.conversion || "Purchase",
        }, fromDate, toDate);
        break;

      case "lifecycle":
        result = await analyzeLifecycle(client, parsed.data.projectId, {
          signup: eventParams.signup || "Sign Up",
          activity: eventParams.activity || "App Open",
        }, fromDate, toDate);
        break;

      case "context":
        result = await analyzeContext(client, parsed.data.projectId, {
          target: eventParams.target || "Purchase",
          comparison: eventParams.comparison || "App Open",
        }, fromDate, toDate);
        break;
    }

    res.json(result);
  } catch (error: any) {
    console.error(`Analysis ${type} error:`, error.message);
    // Fallback to mock data on error
    const handler = mockHandlers[type];
    const mockResult = handler(parsed.data.projectId) as any;
    mockResult.warnings = [`실제 데이터 조회 실패로 샘플 데이터를 표시합니다: ${error.message}`];
    res.json(mockResult);
  }
});

export default router;
