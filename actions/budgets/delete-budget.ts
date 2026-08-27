"use server";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { getLinkedBudgetDeletionError } from "@/lib/official-budgets/deletion-guard";
import { requireAdminSession } from "@/lib/require-admin-session";
import { PublishOfficialBudgetSchema } from "@/schemas/official-budget";

export default async function deleteBudget(budgetId: string) {
  try {
    await requireAdminSession();
    const parsed = PublishOfficialBudgetSchema.safeParse({
      sourceBudgetId: budgetId,
    });
    if (!parsed.success) {
      return { error: "Presupuesto invalido" };
    }

    const linkedOfficialBudget = await db.officialBudget.findUnique({
      where: { sourceBudgetId: parsed.data.sourceBudgetId },
      select: { id: true },
    });
    const deletionError = getLinkedBudgetDeletionError(
      linkedOfficialBudget?.id
    );
    if (deletionError) {
      return { error: deletionError };
    }

    await db.budget.delete({
      where: { id: parsed.data.sourceBudgetId },
    });

    return { success: "Presupuesto eliminado exitosamente" };
  } catch (error) {
    console.error("Error deleting budget:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "No se puede eliminar un generador vinculado a un presupuesto oficial",
      };
    }
    return {
      error: getActionErrorMessage(error, "Error eliminando el presupuesto"),
    };
  }
}
