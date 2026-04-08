import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

const NL_QUERY_URL = process.env.NL_QUERY_API_URL || "https://mixpanel-nl-query-production.up.railway.app";

// GET /api/nl-auth — Proxy auth to mixpanel-nl-query server using current credentials
router.get("/nl-auth", requireAuth, async (req, res) => {
  const credentials = (req as any).mixpanelCredentials;

  try {
    const authRes = await fetch(`${NL_QUERY_URL}/api/mixpanel/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: credentials.username,
        secret: credentials.secret,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!authRes.ok) {
      const errData = (await authRes.json().catch(() => ({}))) as Record<string, unknown>;
      res.status(authRes.status).json({
        error: (errData as any).error || "NL Query 서버 인증 실패",
        code: "nl_auth_failed",
      });
      return;
    }

    const data = (await authRes.json()) as { sessionToken?: string; projects?: unknown[] };
    res.json({
      sessionToken: data.sessionToken,
      projects: data.projects || [],
    });
  } catch (error: any) {
    console.error("NL auth proxy error:", error.message);
    res.status(502).json({
      error: "NL Query 서버에 연결할 수 없습니다.",
      code: "nl_server_unavailable",
    });
  }
});

export default router;
