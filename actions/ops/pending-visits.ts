"use server";

import { getActionErrorMessage } from "@/lib/ops/action-error";
import { resolvePendingVisitsInDb } from "@/lib/ops/pending-visit-resolution";
import { requireAdminSession } from "@/lib/require-admin-session";
import { ResolvePendingVisitsSchema } from "@/schemas/ops/pending-visits";

const SUCCESS = {
  ASSIGN: "Visitas asignadas",
  CANCELED: "Visitas canceladas",
  DELETE: "Visitas eliminadas",
  DONE: "Visitas registradas como hechas",
  SKIPPED: "Visitas marcadas como omitidas",
} as const;

// Resuelve de una vez visitas pendientes de registro (vista Pendientes).
export const resolvePendingVisits = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedValues = ResolvePendingVisitsSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: parsedValues.error.issues[0]?.message ?? "Datos invalidos para resolver las visitas" };
    }

    const result = await resolvePendingVisitsInDb(parsedValues.data, session.user.id);
    if ("error" in result) {
      return { error: result.error };
    }

    return { count: result.count, success: SUCCESS[parsedValues.data.action] };
  } catch (error) {
    console.error("Error resolving pending visits:", error);
    return {
      error: getActionErrorMessage(error, "Error al resolver las visitas pendientes"),
    };
  }
};
