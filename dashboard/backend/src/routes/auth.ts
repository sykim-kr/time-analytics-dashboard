import { Router } from "express";
import { setToken, clearToken, isMockMode } from "../middleware/auth";

const router = Router();

// GET /api/auth — Start OAuth (mock: set token + redirect)
router.get("/auth", (req, res) => {
  if (isMockMode()) {
    setToken(res, "mock_token_" + Date.now());
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
    res.redirect(frontendUrl + "/?authenticated=true");
    return;
  }
  res.status(501).json({ error: "Real OAuth not implemented yet" });
});

// GET /api/callback — OAuth callback
router.get("/callback", (req, res) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  res.redirect(frontendUrl);
});

// POST /api/logout — Clear token
router.post("/logout", (req, res) => {
  clearToken(res);
  res.json({ success: true });
});

export default router;
