"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobScheduleRuleAction } from "@/components/ops/actions/jobs/archive-job-schedule-rule.action";
import { createJobScheduleRuleAction } from "@/components/ops/actions/jobs/create-job-schedule-rule.action";
import { generateJobOccurrencesAction } from "@/components/ops/actions/jobs/generate-job-occurrences.action";
import { updateJobScheduleRuleAction } from "@/components/ops/actions/jobs/update-job-schedule-rule.action";
import {
  applyScheduleRuleChangeAction,
  cleanupScheduleRuleVisitsAction,
  undoScheduleRuleCleanupAction,
} from "@/components/ops/actions/schedule-rules/schedule-rule-board.action";
import { invalidateJobScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { formToRuleValues, generateRangeFor, type RuleFormState } from "@/components/ops/schedule-rules/rule-form-model";
import { dayLabel, plural, type BoardRule } from "@/components/ops/schedule-rules/schedule-rules-model";
import { orThrow } from "@/components/ops/schedule-rules/use-schedule-rules-queries";
import type { ScheduleRuleCleanupDirection } from "@/schemas/ops/schedule-rule-board";

type CleanupRequest = { adjustRule: boolean; cutDate: string; direction: ScheduleRuleCleanupDirection; rule: BoardRule };
type RuleDatesListener = (ruleId: string, startKey: string, endKey: string | null) => void;
type Undo = { occurrenceIds: string[]; previousEndDate: string | null; previousStartDate: string; scheduleRuleId: string };

const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

// Guardar, limpiar y eliminar horarios desde la vista de reglas. Cada cambio
// refresca trabajos, visitas y reglas; limpiar y eliminar ofrecen Deshacer.
export const useScheduleRuleBoardMutations = (todayKey: string, onRuleDates: RuleDatesListener) => {
  const queryClient = useQueryClient();
  const refresh = (jobId: string) => invalidateJobScopes(queryClient, { jobId });

  const undo = async (jobId: string, data: Undo, reactivate: boolean) => {
    try {
      orThrow(await undoScheduleRuleCleanupAction(data));
      onRuleDates(data.scheduleRuleId, data.previousStartDate, data.previousEndDate);
      if (reactivate) await updateJobScheduleRuleAction(data.scheduleRuleId, { isActive: true });
      toast.success("Listo, quedó como estaba");
    } catch (error) {
      toast.error(errorText(error, "No se pudo deshacer"));
    }
    await refresh(jobId);
  };

  const offerUndo = (message: string, jobId: string, data: Undo, reactivate = false) =>
    toast.success(message, {
      action: { label: "Deshacer", onClick: () => void undo(jobId, data, reactivate) },
      duration: 12_000,
    });

  const create = useMutation({
    mutationFn: async ({ form, jobId }: { form: RuleFormState; jobId: string }) => {
      const values = formToRuleValues(form);
      const rule = await createJobScheduleRuleAction({
        ...values,
        dayOfMonth: values.dayOfMonth ?? undefined,
        endDate: values.endDate ?? undefined,
        jobId,
      });
      const range = form.generate ? generateRangeFor(form, todayKey) : null;
      const generated = rule && range ? await generateJobOccurrencesAction({ ...range, scheduleRuleId: rule.id }) : null;
      return { generated: generated?.visits ?? null, jobId, until: range?.endDate };
    },
    onSuccess: async ({ generated, jobId, until }) => {
      toast.success("Horario guardado", {
        description: generated === null ? "Sin generar visitas." : `Se generaron ${plural(generated, "visita", "visitas")} hasta el ${dayLabel(until ?? todayKey)}.`,
      });
      await refresh(jobId);
    },
    onError: (error) => toast.error(errorText(error, "No se pudo guardar el horario")),
  });

  const update = useMutation({
    mutationFn: async ({ form, rule }: { form: RuleFormState; rule: BoardRule }) => {
      await updateJobScheduleRuleAction(rule.id, formToRuleValues(form));
      const applied = orThrow(await applyScheduleRuleChangeAction({ applyFrom: form.applyFrom, scheduleRuleId: rule.id })).applied;
      return { applied, form, jobId: rule.jobId };
    },
    onSuccess: async ({ applied, form, jobId }) => {
      const redone = applied ? applied.deleted + applied.visits : 0;
      const kept = applied?.kept ? ` ${plural(applied.kept, "visita editada quedó", "visitas editadas quedaron")} como estaba${applied.kept === 1 ? "" : "n"}.` : "";
      toast.success("Horario actualizado", {
        description: redone ? `Se rehicieron las visitas desde el ${dayLabel(form.applyFrom)}.${kept}` : `No había visitas para rehacer.${kept}`,
      });
      await refresh(jobId);
    },
    onError: (error) => toast.error(errorText(error, "No se pudo actualizar el horario")),
  });

  const cleanup = useMutation({
    mutationFn: async ({ adjustRule, cutDate, direction, rule }: CleanupRequest) => ({
      result: orThrow(await cleanupScheduleRuleVisitsAction({ adjustRule, cutDate, direction, scheduleRuleId: rule.id })).cleanup,
      rule,
    }),
    onSuccess: async ({ result, rule }) => {
      if (result) {
        onRuleDates(rule.id, result.startDate, result.endDate);
        const count = result.archivedIds.length;
        const message = count
          ? `Se eliminaron ${plural(count, "visita", "visitas")}${result.ruleChanged ? " y se ajustó el horario" : ""}`
          : "Se ajustó el horario";
        offerUndo(message, rule.jobId, {
          occurrenceIds: result.archivedIds,
          previousEndDate: result.previousEndDate,
          previousStartDate: result.previousStartDate,
          scheduleRuleId: rule.id,
        });
      }
      await refresh(rule.jobId);
    },
    onError: (error) => toast.error(errorText(error, "No se pudieron eliminar las visitas")),
  });

  // Eliminar el horario: archiva sus visitas que no pasaron desde hoy y la
  // regla deja de estar activa. Las realizadas quedan.
  const remove = useMutation({
    mutationFn: async (rule: BoardRule) => {
      const result = orThrow(
        await cleanupScheduleRuleVisitsAction({ adjustRule: false, cutDate: todayKey, direction: "FORWARD", scheduleRuleId: rule.id })
      ).cleanup;
      await archiveJobScheduleRuleAction(rule.id);
      return { result, rule };
    },
    onSuccess: async ({ result, rule }) => {
      if (result) {
        offerUndo("Se eliminó el horario y sus visitas desde hoy", rule.jobId, {
          occurrenceIds: result.archivedIds,
          previousEndDate: result.previousEndDate,
          previousStartDate: result.previousStartDate,
          scheduleRuleId: rule.id,
        }, true);
      }
      await refresh(rule.jobId);
    },
    onError: (error) => toast.error(errorText(error, "No se pudo eliminar el horario")),
  });

  return {
    cleanup: cleanup.mutateAsync,
    create: create.mutateAsync,
    isCleaning: cleanup.isPending,
    isRemoving: remove.isPending,
    isSaving: create.isPending || update.isPending,
    remove: remove.mutateAsync,
    update: update.mutateAsync,
  };
};
