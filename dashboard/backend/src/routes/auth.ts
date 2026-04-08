import { Router } from "express";
import { setCredentialsCookie, clearCredentialsCookie, isMockMode } from "../middleware/auth";
import { createMixpanelClient } from "../lib/mixpanel-client";

const router = Router();

// POST /api/auth — Validate Service Account credentials and store in cookie
router.post("/auth", async (req, res) => {
  const { username, secret, projectId } = req.body;

  if (!username || !secret || !projectId) {
    res.status(400).json({ error: "username, secret, projectId are required", code: "invalid_params" });
    return;
  }

  if (isMockMode()) {
    setCredentialsCookie(res, { username, secret, projectId: Number(projectId) });
    res.json({ success: true, projectId: Number(projectId) });
    return;
  }

  // Validate credentials against Mixpanel
  const client = createMixpanelClient(username, secret);
  const valid = await client.validateCredentials();

  if (!valid) {
    res.status(401).json({ error: "Mixpanel 인증에 실패했습니다. 자격 증명을 확인해 주세요.", code: "auth_expired" });
    return;
  }

  setCredentialsCookie(res, { username, secret, projectId: Number(projectId) });
  res.json({ success: true, projectId: Number(projectId) });
});

// Keep GET /api/auth for backwards compatibility (mock mode redirect)
router.get("/auth", (req, res) => {
  if (isMockMode()) {
    setCredentialsCookie(res, { username: "mock", secret: "mock", projectId: 1 });
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
    res.redirect(frontendUrl + "/?authenticated=true");
    return;
  }
  res.status(400).json({ error: "Use POST /api/auth with Service Account credentials" });
});

// GET /api/callback — keep for backwards compat
router.get("/callback", (req, res) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  res.redirect(frontendUrl);
});

// POST /api/logout — Clear credentials
router.post("/logout", (req, res) => {
  clearCredentialsCookie(res);
  res.json({ success: true });
});

export default router;
