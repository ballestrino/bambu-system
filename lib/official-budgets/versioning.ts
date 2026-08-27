import { Prisma } from "@prisma/client";

import { buildOfficialVersionData } from "@/lib/official-budgets/persistence";
import { createOfficialBudgetSnapshot } from "@/lib/official-budgets/snapshot";

export class OfficialBudgetDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfficialBudgetDomainError";
  }
}

const loadGeneratorBudget = async (
  tx: Prisma.TransactionClient,
  sourceBudgetId: string
) => {
  await tx.$queryRaw(
    Prisma.sql`SELECT "id" FROM "Budget" WHERE "id" = ${sourceBudgetId} FOR UPDATE`
  );
  const budget = await tx.budget.findUnique({
    where: { id: sourceBudgetId },
    include: {
      budgetCategory: { orderBy: { name: "asc" } },
      budgetOptions: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });

  if (!budget) {
    throw new OfficialBudgetDomainError("Presupuesto generador no encontrado");
  }

  if (budget.budgetOptions.length === 0) {
    throw new OfficialBudgetDomainError(
      "El presupuesto generador no tiene opciones publicables"
    );
  }

  return budget;
};

export const publishOfficialBudgetInTransaction = async (
  tx: Prisma.TransactionClient,
  sourceBudgetId: string,
  actorId: string
) => {
  const generator = await loadGeneratorBudget(tx, sourceBudgetId);
  const snapshot = createOfficialBudgetSnapshot(generator);
  const officialBudget = await tx.officialBudget.create({
    data: {
      sourceBudget: { connect: { id: sourceBudgetId } },
      sourceBudgetName: generator.name,
      sourceBudgetSlug: generator.slug,
      createdBy: { connect: { id: actorId } },
      versions: {
        create: buildOfficialVersionData(snapshot, 1, actorId),
      },
    },
    include: { versions: { include: { options: true } } },
  });

  await tx.officialBudgetAuditEvent.create({
    data: {
      officialBudgetId: officialBudget.id,
      actorId,
      action: "PUBLISHED",
      version: 1,
      metadata: { sourceBudgetId, sourceBudgetSlug: generator.slug },
    },
  });

  return officialBudget;
};

export const appendLinkedOfficialBudgetVersion = async (
  tx: Prisma.TransactionClient,
  sourceBudgetId: string,
  actorId: string
) => {
  const linked = await tx.officialBudget.findUnique({
    where: { sourceBudgetId },
    select: { id: true, status: true },
  });

  if (!linked || linked.status !== "ACTIVE") {
    return null;
  }

  const generator = await loadGeneratorBudget(tx, sourceBudgetId);
  const snapshot = createOfficialBudgetSnapshot(generator);
  const incremented = await tx.officialBudget.updateMany({
    where: { id: linked.id, status: "ACTIVE", sourceBudgetId },
    data: {
      currentVersion: { increment: 1 },
      sourceBudgetName: generator.name,
      sourceBudgetSlug: generator.slug,
    },
  });
  if (incremented.count !== 1) {
    return null;
  }
  const officialBudget = await tx.officialBudget.findUniqueOrThrow({
    where: { id: linked.id },
    select: { id: true, currentVersion: true },
  });
  const version = await tx.officialBudgetVersion.create({
    data: {
      officialBudget: { connect: { id: officialBudget.id } },
      ...buildOfficialVersionData(
        snapshot,
        officialBudget.currentVersion,
        actorId
      ),
    },
    include: { options: true },
  });

  await tx.officialBudgetAuditEvent.create({
    data: {
      officialBudgetId: officialBudget.id,
      actorId,
      action: "VERSION_PUBLISHED",
      version: officialBudget.currentVersion,
      metadata: { sourceBudgetId, sourceBudgetSlug: generator.slug },
    },
  });

  return version;
};

export const archiveOfficialBudgetInTransaction = async (
  tx: Prisma.TransactionClient,
  officialBudgetId: string,
  actorId: string
) => {
  const existing = await tx.officialBudget.findUnique({
    where: { id: officialBudgetId },
    select: { status: true, sourceBudgetId: true, sourceBudgetSlug: true },
  });

  if (!existing) {
    throw new OfficialBudgetDomainError("Presupuesto oficial no encontrado");
  }
  if (existing.status !== "ACTIVE" || !existing.sourceBudgetId) {
    throw new OfficialBudgetDomainError("El presupuesto oficial ya esta archivado");
  }

  const archivedAt = new Date();
  const archivedCount = await tx.officialBudget.updateMany({
    where: {
      id: officialBudgetId,
      status: "ACTIVE",
      sourceBudgetId: existing.sourceBudgetId,
    },
    data: {
      status: "ARCHIVED",
      sourceBudgetId: null,
      archivedAt,
      archivedById: actorId,
    },
  });
  if (archivedCount.count !== 1) {
    throw new OfficialBudgetDomainError("El presupuesto oficial ya esta archivado");
  }
  const archived = await tx.officialBudget.findUniqueOrThrow({
    where: { id: officialBudgetId },
  });
  await tx.officialBudgetAuditEvent.create({
    data: {
      officialBudgetId,
      actorId,
      action: "ARCHIVED",
      version: archived.currentVersion,
      metadata: {
        detachedSourceBudgetId: existing.sourceBudgetId,
        sourceBudgetSlug: existing.sourceBudgetSlug,
      },
    },
  });

  return archived;
};
