import { z } from "zod";

export const OfficialBudgetIdSchema = z.object({
  officialBudgetId: z.string().cuid(),
});

export const PublishOfficialBudgetSchema = z.object({
  sourceBudgetId: z.string().cuid(),
});

export const OfficialBudgetListSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  query: z.string().trim().max(120).optional(),
});
