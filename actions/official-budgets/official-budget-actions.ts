"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import {
  archiveOfficialBudgetInTransaction,
  OfficialBudgetDomainError,
  publishOfficialBudgetInTransaction,
} from "@/lib/official-budgets/versioning";
import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";
import {
  OfficialBudgetIdSchema,
  PublishOfficialBudgetSchema,
} from "@/schemas/official-budget";

const actionError = (error: unknown, fallback: string) => {
  if (
    error instanceof AdminAuthorizationError ||
    error instanceof OfficialBudgetDomainError
  ) {
    return error.message;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Este presupuesto generador ya esta vinculado a uno oficial";
  }
  return fallback;
};

export const publishOfficialBudget = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = PublishOfficialBudgetSchema.safeParse(values);
    if (!parsed.success) {
      return { error: "Presupuesto generador invalido" };
    }

    const officialBudget = await db.$transaction((tx) =>
      publishOfficialBudgetInTransaction(
        tx,
        parsed.data.sourceBudgetId,
        session.user.id
      )
    );
    revalidatePath("/dashboard/budgets");
    revalidatePath("/dashboard/official-budgets");

    return {
      success: "Presupuesto oficial publicado",
      officialBudgetId: officialBudget.id,
      version: officialBudget.currentVersion,
    };
  } catch (error) {
    console.error("Error publishing official budget:", error);
    return { error: actionError(error, "Error al publicar el presupuesto oficial") };
  }
};

export const archiveOfficialBudget = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = OfficialBudgetIdSchema.safeParse(values);
    if (!parsed.success) {
      return { error: "Presupuesto oficial invalido" };
    }

    const officialBudget = await db.$transaction((tx) =>
      archiveOfficialBudgetInTransaction(
        tx,
        parsed.data.officialBudgetId,
        session.user.id
      )
    );
    revalidatePath("/dashboard/budgets");
    revalidatePath("/dashboard/official-budgets");

    return {
      success: "Presupuesto oficial archivado",
      officialBudgetId: officialBudget.id,
    };
  } catch (error) {
    console.error("Error archiving official budget:", error);
    return { error: actionError(error, "Error al archivar el presupuesto oficial") };
  }
};
