import { Router } from "express";
import { requireAuth, isMockMode } from "../middleware/auth";
import { analysisQuerySchema } from "../lib/validation";
import { getMockData as getCalendar } from "../lib/mock/calendar";
import { getMockData as getTimetox } from "../lib/mock/timetox";
import { getMockData as getRetention } from "../lib/mock/retention";
import { getMockData as getVelocity } from "../lib/mock/velocity";
import { getMockData as getLifecycle } from "../lib/mock/lifecycle";
import { getMockData as getContext } from "../lib/mock/context";

const router = Router();

const mockHandlers: Record<string, (projectId: number) => unknown> = {
  calendar: getCalendar,
  timetox: getTimetox,
  retention: getRetention,
  velocity: getVelocity,
  lifecycle: getLifecycle,
  context: getContext,
};

router.get("/analysis/:type", requireAuth, (req, res) => {
  const type = req.params.type as string;
  const handler = mockHandlers[type];
  if (!handler) {
    res.status(404).json({ error: `Unknown analysis type: ${type}`, code: "not_found" });
    return;
  }

  const parsed = analysisQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid parameters", code: "invalid_params", details: parsed.error.message });
    return;
  }

  // For now, always return mock data
  // Real Mixpanel Query API integration requires saved report bookmark_ids
  // which will be implemented when connecting to actual Mixpanel projects
  const data = handler(parsed.data.projectId);
  res.json(data);
});

export default router;
