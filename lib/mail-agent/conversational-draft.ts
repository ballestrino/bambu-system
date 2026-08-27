import { db } from "@/lib/db";
import { appendMailDraftRevision } from "@/lib/mail-agent/draft-revisions";
import {
  generateGroundedRevision,
  type SearchMatch,
} from "@/lib/mail-agent/draft-model";
import { enforceMailDraftSafety } from "@/lib/mail-agent/draft";
import { validateGroundedDraft } from "@/lib/mail-agent/grounded-draft";

const categoryNames = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        item && typeof item === "object" && "name" in item ? [String(item.name)] : []
      )
    : [];

type StoredSource = Awaited<ReturnType<typeof loadConversation>>["revisions"][number]["sources"][number];

const storedSourceMatch = (source: StoredSource): SearchMatch => {
  const version = source.officialBudgetVersion;
  const budget = version.officialBudget;
  const option = source.officialBudgetOption;
  return {
    sourceOptionId: option.id,
    officialBudget: {
      id: budget.id,
      name: budget.sourceBudgetName,
      slug: budget.sourceBudgetSlug,
      generatorId: budget.sourceBudgetId,
    },
    immutableVersion: {
      id: version.id,
      number: version.version,
      publishedAt: version.publishedAt.toISOString(),
    },
    service: {
      name: version.serviceName,
      description: version.serviceDescription,
      categories: categoryNames(version.serviceCategories),
    },
    conditions: {
      frequency: option.visitType,
      visits: option.visits,
      hoursPerVisit: Number(option.hoursPerVisit),
      employees: option.employees,
      hasProducts: option.hasProducts,
    },
    prices: {
      currency: version.currency,
      net: Number(option.netPrice),
      ivaPercent: Number(option.ivaPercent),
      ivaAmount: Number(option.ivaAmount),
      final: Number(option.finalPrice),
      hourlyNet: Number(option.hourlyPrice),
    },
    workload: {
      effectiveMonthlyVisits: Number(option.effectiveMonthlyVisits),
      monthlyHours: Number(option.monthlyWorkload),
      isEstimate: option.monthlyWorkloadIsEstimate,
      weeklyMultiplier: Number(option.weeklyMultiplier),
    },
    calculation: option.calculationMetadata,
  };
};

const loadConversation = (suggestionId: string) =>
  db.mailSuggestion.findUniqueOrThrow({
    where: { id: suggestionId },
    include: {
      message: true,
      revisions: {
        orderBy: { revision: "desc" },
        take: 4,
        include: {
          sources: {
            include: {
              officialBudgetOption: true,
              officialBudgetVersion: { include: { officialBudget: true } },
            },
          },
        },
      },
    },
  });

export const reviseMailDraftWithLuna = async (input: {
  suggestionId: string;
  instruction: string;
  actorId: string;
  safetyIdentifier: string;
}) => {
  const conversation = await loadConversation(input.suggestionId);
  const current = conversation.revisions[0];
  if (!current) throw new Error("El borrador no tiene una revisión base");
  const evidence = new Map<string, SearchMatch>();
  current.sources.forEach((source) => {
    const match = storedSourceMatch(source);
    evidence.set(match.sourceOptionId, match);
  });
  const prompt = JSON.stringify({
    incoming: {
      subject: conversation.message.subject,
      body: conversation.message.bodyText,
      from: conversation.message.fromAddress,
    },
    administratorInstruction: input.instruction,
    currentDraft: { subject: current.subject, body: current.body },
    recentRevisionContext: conversation.revisions.slice(0, 3).reverse().map((revision) => ({
      revision: revision.revision,
      origin: revision.origin,
      instruction: revision.instruction,
      subject: revision.subject,
      body: revision.body,
    })),
    currentOfficialSources: [...evidence.values()],
  });
  const result = await generateGroundedRevision(prompt, input.safetyIdentifier, evidence);
  const grounding = validateGroundedDraft(result.draft, result.evidence);
  const preservedSources = new Map(
    current.sources.map((source) => [source.officialBudgetOptionId, {
      officialBudgetVersionId: source.officialBudgetVersionId,
      officialBudgetOptionId: source.officialBudgetOptionId,
    }])
  );
  grounding.sources.forEach((source) => preservedSources.set(source.sourceOptionId, {
    officialBudgetVersionId: source.immutableVersion.id,
    officialBudgetOptionId: source.sourceOptionId,
  }));
  const draft = enforceMailDraftSafety(
    result.draft,
    conversation.message,
    preservedSources.size > 0
  );
  return appendMailDraftRevision({
    suggestionId: input.suggestionId,
    subject: draft.subject,
    body: draft.body,
    origin: "AI",
    actorId: input.actorId,
    instruction: input.instruction,
    sources: [...preservedSources.values()],
    analysis: draft,
  });
};
