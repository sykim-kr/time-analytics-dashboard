import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

const NL_QUERY_URL = process.env.NL_QUERY_API_URL || "https://mixpanel-nl-query-production.up.railway.app";

// GET /api/nl-auth — Proxy auth to mixpanel-nl-query server
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

// POST /api/nl-query — Proxy SSE query to mixpanel-nl-query server
router.post("/nl-query", requireAuth, async (req, res) => {
  const { question, sessionToken, projectId } = req.body;

  if (!question || !sessionToken || !projectId) {
    res.status(400).json({ error: "question, sessionToken, projectId are required" });
    return;
  }

  try {
    const queryRes = await fetch(`${NL_QUERY_URL}/api/query/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        provider: "anthropic",
        projectId: String(projectId),
        sessionToken,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!queryRes.ok) {
      const errData = (await queryRes.json().catch(() => ({}))) as Record<string, unknown>;
      res.status(queryRes.status).json({
        error: (errData as any).error || "NL Query 실패",
      });
      return;
    }

    // Stream SSE response through
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = queryRes.body?.getReader();
    if (!reader) {
      res.status(500).json({ error: "스트림을 읽을 수 없습니다." });
      return;
    }

    const decoder = new TextDecoder();

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      res.end();
    };

    req.on("close", () => {
      reader.cancel();
    });

    await pump();
  } catch (error: any) {
    console.error("NL query proxy error:", error.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: "NL Query 서버에 연결할 수 없습니다.",
      });
    } else {
      res.end();
    }
  }
});

export default router;
