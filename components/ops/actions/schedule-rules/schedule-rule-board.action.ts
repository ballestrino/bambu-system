"use server";

import {
  applyScheduleRuleChange,
  cleanupScheduleRuleVisits,
  undoScheduleRuleCleanup,
} from "@/actions/ops/schedule-rule-board";
import { serializeActionResult } from "@/components/ops/actions/shared/serialize-action-result";
import { getScheduleRuleVisits, getScheduleRulesBoard } from "@/data/ops/schedule-rules-board";
import type {
  ApplyScheduleRuleChangeInput,
  ScheduleRuleCleanupInput,
  ScheduleRuleCleanupUndoInput,
  ScheduleRuleVisitsInput,
} from "@/schemas/ops/schedule-rule-board";

// Envoltorios de la vista de reglas de calendario. Devuelven { error } en vez
// de tirarlo: en producción Next oculta el mensaje de un error del servidor, y
// lo tira el hook del cliente (use-schedule-rules-queries).

export const getScheduleRulesBoardAction = async () => serializeActionResult(await getScheduleRulesBoard());

export const getScheduleRuleVisitsAction = async (input: ScheduleRuleVisitsInput) =>
  serializeActionResult(await getScheduleRuleVisits(input));

export const cleanupScheduleRuleVisitsAction = async (input: ScheduleRuleCleanupInput) =>
  serializeActionResult(await cleanupScheduleRuleVisits(input));

export const undoScheduleRuleCleanupAction = async (input: ScheduleRuleCleanupUndoInput) =>
  serializeActionResult(await undoScheduleRuleCleanup(input));

export const applyScheduleRuleChangeAction = async (input: ApplyScheduleRuleChangeInput) =>
  serializeActionResult(await applyScheduleRuleChange(input));
