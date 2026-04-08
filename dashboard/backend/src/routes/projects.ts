import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/projects", requireAuth, (req, res) => {
  const credentials = (req as any).mixpanelCredentials;
  // Return the project from credentials — user already specified it during auth
  const projects = [
    { id: credentials.projectId, name: `Project ${credentials.projectId}` },
  ];
  res.json({ projects });
});

export default router;
