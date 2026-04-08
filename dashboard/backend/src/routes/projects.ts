import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/projects", requireAuth, (req, res) => {
  const projects = [
    { id: 1, name: "My App Production" },
    { id: 2, name: "Staging" },
    { id: 3, name: "Marketing Site" },
  ];
  res.json({ projects });
});

export default router;
