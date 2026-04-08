const MIXPANEL_API = "https://mixpanel.com/api";
const MIXPANEL_DATA_API = "https://data.mixpanel.com/api/2.0";
const MIXPANEL_EU_API = "https://eu.mixpanel.com/api";

export class MixpanelClient {
  private authHeader: string;

  constructor(username: string, secret: string) {
    this.authHeader = "Basic " + Buffer.from(`${username}:${secret}`).toString("base64");
  }

  private async rawRequest(url: string, timeout = 30000): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 120) * 1000));
      return this.rawRequest(url, timeout);
    }

    return response;
  }

  async request(path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${MIXPANEL_API}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await this.rawRequest(url.toString());
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mixpanel API error ${response.status}: ${text}`);
    }
    return response.json();
  }

  // ── Auth & Projects ──

  async validateCredentials(): Promise<boolean> {
    try {
      await this.request("/app/me");
      return true;
    } catch {
      return false;
    }
  }

  async getProjects(): Promise<{ id: number; name: string }[]> {
    const data = await this.request("/app/me");
    const projects = data.results?.projects;
    if (!projects) return [];
    return Object.entries(projects)
      .map(([id, proj]: [string, any]) => ({ id: Number(id), name: proj.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getEvents(projectId: number): Promise<string[]> {
    const data = await this.request("/2.0/events/names", {
      project_id: String(projectId),
      limit: "500",
    });
    return Array.isArray(data) ? data : [];
  }

  async getTopEvents(projectId: number, limit = 100): Promise<{ event: string; amount: number }[]> {
    const data = await this.request("/2.0/events/top", {
      project_id: String(projectId),
      type: "general",
      limit: String(limit),
    });
    if (!data?.events || !Array.isArray(data.events)) return [];
    return data.events
      .filter((e: any) => !String(e.event).startsWith("$mp_"))
      .map((e: any) => ({ event: String(e.event), amount: Number(e.amount) || 0 }));
  }

  // ── Segmentation API (event counts over time) ──

  async segmentation(
    projectId: number,
    event: string,
    fromDate: string,
    toDate: string,
    unit: "hour" | "day" | "week" | "month" = "day",
    segmentOn?: string
  ): Promise<any> {
    const params: Record<string, string> = {
      project_id: String(projectId),
      event: JSON.stringify(event),
      from_date: fromDate,
      to_date: toDate,
      unit,
    };
    if (segmentOn) {
      params.on = JSON.stringify(segmentOn);
    }
    return this.request("/2.0/segmentation", params);
  }

  // ── Segmentation with multiple events ──

  async segmentationMulti(
    projectId: number,
    events: string[],
    fromDate: string,
    toDate: string,
    unit: "hour" | "day" | "week" | "month" = "day"
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    for (const event of events) {
      try {
        results[event] = await this.segmentation(projectId, event, fromDate, toDate, unit);
      } catch {
        results[event] = null;
      }
    }
    return results;
  }

  // ── Funnels API ──

  async queryFunnels(projectId: number, params: Record<string, string>): Promise<any> {
    return this.request("/2.0/funnels", { project_id: String(projectId), ...params });
  }

  // ── Retention API ──

  async queryRetention(projectId: number, params: Record<string, string>): Promise<any> {
    return this.request("/2.0/retention", { project_id: String(projectId), ...params });
  }

  // ── Insights/Query API ──

  async queryInsights(projectId: number, params: Record<string, string> = {}): Promise<any> {
    return this.request("/query/insights", { project_id: String(projectId), ...params });
  }

  // ── Raw Export API ──

  async exportEvents(
    projectId: number,
    fromDate: string,
    toDate: string,
    event?: string,
    limit?: number
  ): Promise<any[]> {
    const params: Record<string, string> = {
      project_id: String(projectId),
      from_date: fromDate,
      to_date: toDate,
    };
    if (event) params.event = JSON.stringify([event]);
    if (limit) params.limit = String(limit);

    const url = `${MIXPANEL_DATA_API}/export?${new URLSearchParams(params)}`;
    const response = await this.rawRequest(url, 120000);
    if (!response.ok) throw new Error(`Export API error ${response.status}`);
    const text = await response.text();
    return text
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  // ── Event counts (simple totals) ──

  async eventCounts(
    projectId: number,
    events: string[],
    fromDate: string,
    toDate: string
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const event of events) {
      try {
        const data = await this.segmentation(projectId, event, fromDate, toDate, "day");
        const values = data?.data?.values?.[event];
        if (values) {
          counts[event] = Object.values(values).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
        } else {
          counts[event] = 0;
        }
      } catch {
        counts[event] = 0;
      }
    }
    return counts;
  }
}

export function createMixpanelClient(username: string, secret: string): MixpanelClient {
  return new MixpanelClient(username, secret);
}
