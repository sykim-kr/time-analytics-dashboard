const MIXPANEL_BASE_URL = "https://mixpanel.com/api";

export class MixpanelClient {
  private authHeader: string;

  constructor(username: string, secret: string) {
    this.authHeader = "Basic " + Buffer.from(`${username}:${secret}`).toString("base64");
  }

  async request(path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${MIXPANEL_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": this.authHeader,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (response.status === 429) {
      // Rate limited — wait and retry once
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.request(path, params);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mixpanel API error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.request("/app/me");
      return true;
    } catch {
      return false;
    }
  }

  async getEvents(projectId: number): Promise<any> {
    return this.request(`/app/projects/${projectId}/schema/events`);
  }

  async queryInsights(projectId: number, params: Record<string, string> = {}): Promise<any> {
    return this.request("/query/insights", { project_id: String(projectId), ...params });
  }

  async queryFunnels(projectId: number, params: Record<string, string>): Promise<any> {
    return this.request("/query/funnels", { project_id: String(projectId), ...params });
  }

  async queryRetention(projectId: number, params: Record<string, string>): Promise<any> {
    return this.request("/query/retention", { project_id: String(projectId), ...params });
  }

  async exportEvents(projectId: number, fromDate: string, toDate: string, event?: string): Promise<any> {
    const params: Record<string, string> = {
      project_id: String(projectId),
      from_date: fromDate,
      to_date: toDate,
    };
    if (event) params.event = JSON.stringify([event]);
    // Raw export uses a different base URL
    const url = `https://data.mixpanel.com/api/2.0/export?${new URLSearchParams(params)}`;
    const response = await fetch(url, {
      headers: { "Authorization": this.authHeader, "Accept": "application/json" },
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`Export API error ${response.status}`);
    const text = await response.text();
    // Export API returns newline-delimited JSON
    return text.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
  }
}

export function createMixpanelClient(username: string, secret: string): MixpanelClient {
  return new MixpanelClient(username, secret);
}
