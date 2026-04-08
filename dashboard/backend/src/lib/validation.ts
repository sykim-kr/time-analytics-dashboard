import { z } from "zod";

export const analysisQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AnalysisQueryParams = z.infer<typeof analysisQuerySchema>;
