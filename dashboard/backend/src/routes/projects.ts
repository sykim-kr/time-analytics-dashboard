import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createMixpanelClient } from "../lib/mixpanel-client";

const router = Router();

router.get("/projects", requireAuth, async (req, res) => {
  const credentials = (req as any).mixpanelCredentials;
  try {
    const client = createMixpanelClient(credentials.username, credentials.secret);
    const projects = await client.getProjects();
    res.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    // Fallback to credential project if API fails
    res.json({
      projects: [{ id: credentials.projectId, name: `Project ${credentials.projectId}` }],
    });
  }
});

export default router;
