import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import {
  createMailEmbedding,
  storeMailMessageEmbedding,
} from "@/lib/mail-agent/embedding";
import {
  MAIL_DRAFT_INSTRUCTIONS,
  MAIL_DRAFT_JSON_SCHEMA,
} from "@/lib/mail-agent/draft-prompt";
import { getMailOpenAI } from "@/lib/mail-agent/openai-client";
import { getMailRetrievalContext } from "@/lib/mail-agent/retrieval";
import {
  extractProtectedLiterals,
  hasAlwaysManualTopic,
} from "@/lib/mail-agent/safety";
import {
  mailSuggestionOutputSchema,
  type MailSuggestionOutput,
} from "@/schemas/mail";

type ReasoningEffort = "high" | "xhigh";

const generateDraft = async (
  input: string,
  safetyIdentifier: string,
  effort: ReasoningEffort
) => {
  const response = await getMailOpenAI().responses.create({
    model: "gpt-5.6-terra" as never,
    store: false,
    safety_identifier: safetyIdentifier,
    reasoning: { effort },
    instructions: MAIL_DRAFT_INSTRUCTIONS,
    input,
    text: {
      format: {
        type: "json_schema",
        name: "bambu_mail_reply",
        strict: true,
        schema: MAIL_DRAFT_JSON_SCHEMA,
      },
    },
  });
  return mailSuggestionOutputSchema.parse(JSON.parse(response.output_text));
};

const buildInput = (
  message: { subject: string; bodyText: string; fromAddress: string },
  context: Awaited<ReturnType<typeof getMailRetrievalContext>>
) =>
  JSON.stringify({
    incoming: message,
    approvedMemory: context.memories,
    priorSentExamples: context.examples,
    confirmedAutomationRules: context.rules,
  });

const enforceSafety = (
  draft: MailSuggestionOutput,
  message: { subject: string; bodyText: string }
) => {
  const literals = extractProtectedLiterals(`${message.subject}\n${message.bodyText}`);
  const sensitive = hasAlwaysManualTopic(message.subject, message.bodyText);
  return {
    ...draft,
    protectedLiterals: [...new Set([...draft.protectedLiterals, ...literals])],
    manualReviewRequired:
      draft.manualReviewRequired || draft.isComplex || sensitive || draft.riskLevel !== "low",
  };
};

export const generateAndStoreMailSuggestion = async (
  messageId: string,
  safetyIdentifier: string,
  actorId?: string
) => {
  const message = await db.mailMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: { thread: true },
  });
  if (message.direction !== "INBOUND" || message.hasAttachments || message.requiresHandoff) {
    throw new Error("Este mensaje no admite una sugerencia automática");
  }

  await db.mailSuggestion.upsert({
    where: { messageId },
    create: { messageId, status: "PENDING" },
    update: { status: "PENDING", error: null },
  });

  try {
    const embedding = await createMailEmbedding(`${message.subject}\n${message.bodyText}`);
    await storeMailMessageEmbedding(message.id, embedding);
    const context = await getMailRetrievalContext({
      threadId: message.threadId,
      fromAddress: message.fromAddress,
      subject: message.thread.normalizedSubject,
      embedding,
    });
    const input = buildInput(message, context);
    const highDraft = await generateDraft(input, safetyIdentifier, "high");
    const modelDraft = highDraft.isComplex
      ? await generateDraft(input, safetyIdentifier, "xhigh")
      : highDraft;
    const draft = enforceSafety(modelDraft, message);
    const suggestion = await db.mailSuggestion.update({
      where: { messageId },
      data: {
        status: "READY",
        reasoningEffort: highDraft.isComplex ? "xhigh" : "high",
        intent: draft.intent,
        isComplex: draft.isComplex,
        riskLevel: draft.riskLevel,
        confidence: draft.confidence,
        safetyConfidence: draft.safetyConfidence,
        manualReviewRequired: draft.manualReviewRequired,
        subject: draft.subject,
        body: draft.body,
        reasons: draft.reasons,
        protectedLiterals: draft.protectedLiterals,
      },
    });
    if (draft.memories.length) {
      await db.mailMemory.createMany({
        data: draft.memories.map((memory) => ({
          ...memory,
          sourceMessageId: message.id,
          status: "PENDING" as const,
        })),
      });
    }
    await recordMailAudit({
      actorId,
      action: "suggestion.ready",
      entityType: "MailSuggestion",
      entityId: suggestion.id,
      metadata: { effort: suggestion.reasoningEffort, complex: suggestion.isComplex },
    });
    return { suggestion, embedding };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Error desconocido";
    await db.mailSuggestion.update({
      where: { messageId },
      data: { status: "FAILED", error: messageText },
    });
    throw error;
  }
};
