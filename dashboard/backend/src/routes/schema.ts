import { Router } from "express";
import type { SchemaResponse } from "../types";

const router = Router();

router.get("/schema", (req, res) => {
  const projectId = req.query.projectId;
  if (!projectId) {
    res.status(400).json({ error: "projectId required", code: "invalid_params" });
    return;
  }

  const schema: SchemaResponse = {
    events: [
      { name: "App Open", properties: [{ name: "platform", type: "string" }, { name: "version", type: "string" }] },
      { name: "Page View", properties: [{ name: "page_name", type: "string" }, { name: "referrer", type: "string" }] },
      { name: "Sign Up", properties: [{ name: "method", type: "string" }] },
      { name: "Purchase", properties: [{ name: "amount", type: "number" }, { name: "product_id", type: "string" }, { name: "campaign", type: "string" }] },
      { name: "Add to Cart", properties: [{ name: "product_id", type: "string" }, { name: "quantity", type: "number" }] },
      { name: "Session Start", properties: [{ name: "device", type: "string" }] },
      { name: "Search", properties: [{ name: "query", type: "string" }] },
      { name: "Content View", properties: [{ name: "content_id", type: "string" }, { name: "category", type: "string" }] },
    ],
    userProperties: [
      { name: "email", type: "string" },
      { name: "plan", type: "string" },
      { name: "signup_date", type: "datetime" },
    ],
  };

  res.json(schema);
});

export default router;
