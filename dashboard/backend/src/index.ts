import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import projectsRoutes from "./routes/projects";
import schemaRoutes from "./routes/schema";
import analysisRoutes from "./routes/analysis";
import nlAuthRoutes from "./routes/nl-auth";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", projectsRoutes);
app.use("/api", schemaRoutes);
app.use("/api", analysisRoutes);
app.use("/api", nlAuthRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
