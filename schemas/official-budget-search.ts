import { z } from "zod";

const nullableNumber = z.number().finite().positive().nullable();
const nullableInteger = z.number().int().positive().nullable();

export const officialBudgetSearchCriteriaSchema = z.object({
  service: z.string().trim().min(1).max(160).nullable(),
  frequency: z.enum(["days", "week", "month"]).nullable(),
  visits: nullableInteger,
  hoursPerVisit: nullableNumber,
  employees: nullableInteger,
  hasProducts: z.boolean().nullable(),
});

export type OfficialBudgetSearchCriteria = z.infer<
  typeof officialBudgetSearchCriteriaSchema
>;
