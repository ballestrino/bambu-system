"use server";

import { getActionErrorMessage } from "@/lib/ops/action-error";
import { applyScheduleRuleChangeInDb } from "@/lib/ops/schedule-rule-apply";
import {
  cleanupScheduleRuleVisitsInDb,
  undoScheduleRuleCleanupInDb,
} from "@/lib/ops/schedule-rule-cleanup";
import { requireAdminSession } from "@/lib/require-admin-session";
import {
  ApplyScheduleRuleChangeSchema,
  ScheduleRuleCleanupSchema,
  ScheduleRuleCleanupUndoSchema,
} from "@/schemas/ops/schedule-rule-board";

// Acciones de la vista de reglas de calendario (feature 73).

export const cleanupScheduleRuleVisits = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = ScheduleRuleCleanupSchema.safeParse(values);
    if (!parsed.success) return { error: "Datos inválidos para limpiar las visitas" };

    const result = await cleanupScheduleRuleVisitsInDb(parsed.data, session.user.id);
    if ("error" in result) return { error: result.error };
    return { cleanup: result };
  } catch (error) {
    console.error("Error cleaning schedule rule visits:", error);
    return { error: getActionErrorMessage(error, "No se pudieron eliminar las visitas") };
  }
};

export const undoScheduleRuleCleanup = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = ScheduleRuleCleanupUndoSchema.safeParse(values);
    if (!parsed.success) return { error: "Datos inválidos para deshacer" };

    return { undo: await undoScheduleRuleCleanupInDb(parsed.data, session.user.id) };
  } catch (error) {
    console.error("Error undoing schedule rule cleanup:", error);
    return { error: getActionErrorMessage(error, "No se pudo deshacer") };
  }
};

export const applyScheduleRuleChange = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = ApplyScheduleRuleChangeSchema.safeParse(values);
    if (!parsed.success) return { error: "Fecha inválida para aplicar el cambio" };

    return { applied: await applyScheduleRuleChangeInDb(parsed.data, session.user.id) };
  } catch (error) {
    console.error("Error applying schedule rule change:", error);
    return { error: getActionErrorMessage(error, "No se pudieron rehacer las visitas") };
  }
};
