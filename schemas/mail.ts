import { z } from "zod";

const emailList = z
  .string()
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.string().email()).min(1));

export const mailComposeSchema = z.object({
  threadId: z.string().optional(),
  inReplyToId: z.string().optional(),
  to: emailList,
  cc: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(z.string().email())),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(50_000),
});

export const mailSuggestionOutputSchema = z.object({
  intent: z.string().min(1).max(100),
  isComplex: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high", "blocked"]),
  confidence: z.number().min(0).max(1),
  safetyConfidence: z.number().min(0).max(1),
  manualReviewRequired: z.boolean(),
  reasons: z.array(z.string().max(250)).max(8),
  protectedLiterals: z.array(z.string().max(100)).max(30),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(50_000),
  officialBudgetSourceOptionIds: z.array(z.string().min(1)).max(10),
  memories: z
    .array(
      z.object({
        scope: z.enum(["STYLE", "POLICY", "CONTACT", "ORGANIZATION"]),
        key: z.string().min(1).max(120),
        value: z.string().min(1).max(1_000),
        contactEmail: z.string().email().nullable(),
      })
    )
    .max(8),
});

export const mailDraftContentSchema = z.object({
  suggestionId: z.string().min(1),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(50_000),
});

export const mailDraftRevisionRequestSchema = z.object({
  suggestionId: z.string().min(1),
  instruction: z.string().trim().min(3).max(1_000),
});

export const mailDraftRestoreSchema = z.object({
  suggestionId: z.string().min(1),
  revisionId: z.string().min(1),
});

export const mailDraftFeedbackSchema = z.object({
  suggestionId: z.string().min(1),
  revisionId: z.string().min(1),
  outcome: z.enum(["USEFUL", "NOT_USEFUL", "COPIED", "EXTERNAL_SENT"]),
  reason: z.enum(["incorrecto", "incompleto", "tono", "riesgoso", "otro"]).optional(),
  comment: z.string().trim().max(1_000).optional(),
}).superRefine((value, context) => {
  if (value.outcome === "NOT_USEFUL" && !value.reason) {
    context.addIssue({ code: "custom", path: ["reason"], message: "Indicá un motivo" });
  }
});

export const mailMemoryReviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "ARCHIVED"]),
});

export const mailRuleReviewSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]),
});

export const mailMoveThreadSchema = z.object({
  threadId: z.string().min(1).max(100),
  folderKey: z.string().min(1).max(500),
});

const mailThreadIdsSchema = z
  .array(z.string().min(1).max(100))
  .min(1)
  .max(50)
  .transform((threadIds) => [...new Set(threadIds)]);

export const mailMoveThreadsSchema = z.object({
  threadIds: mailThreadIdsSchema,
  folderKey: z.string().min(1).max(500),
});

export const mailArchiveThreadsSchema = z.object({
  threadIds: mailThreadIdsSchema,
  archived: z.boolean(),
});

export type MailSuggestionOutput = z.infer<typeof mailSuggestionOutputSchema>;
