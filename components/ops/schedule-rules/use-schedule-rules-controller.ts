"use client";

import { useMemo, useState } from "react";

import { getTodayKey } from "@/lib/ops/occurrence-generation-presets";
import {
  newRuleForm,
  ruleFormError,
  ruleToForm,
  type RuleFormState,
  type RuleFrequency,
} from "@/components/ops/schedule-rules/rule-form-model";
import {
  countJobsByWeekday,
  getJobWarnings,
  hasRuleWarnings,
  matchesBoardFilter,
  matchesBoardSearch,
  type BoardFilter,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import { useScheduleRuleBoardMutations } from "@/components/ops/schedule-rules/use-schedule-rule-board-mutations";
import { useScheduleRulesBoard } from "@/components/ops/schedule-rules/use-schedule-rules-queries";

export type InspectorMode = "job" | "new" | "rule";
type Selection = { jobId: string | null; mode: InspectorMode; ruleId: string | null };

// Estado compartido por el escritorio y el celular: filtros, qué trabajo y qué
// horario están abiertos, y el formulario.
export const useScheduleRulesController = () => {
  const todayKey = useMemo(() => getTodayKey(), []);
  const board = useScheduleRulesBoard();
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>({ jobId: null, mode: "job", ruleId: null });
  const [form, setFormState] = useState<RuleFormState>(() => newRuleForm("WEEKLY", 1, todayKey));
  const mutations = useScheduleRuleBoardMutations(todayKey, (ruleId, startKey, endKey) =>
    setFormState((current) => (current.ruleId === ruleId ? { ...current, endKey: endKey ?? "", startKey } : current))
  );

  const analysed = useMemo(
    () => board.jobs.map((job) => ({ job, warnings: getJobWarnings(job, todayKey) })),
    [board.jobs, todayKey]
  );
  const counts = {
    all: analysed.length,
    none: analysed.filter(({ job }) => !job.rules.length).length,
    warn: analysed.filter(({ warnings }) => hasRuleWarnings(warnings.list)).length,
  };
  const rows = analysed.filter(
    ({ job, warnings }) => matchesBoardFilter(job, warnings.list, filter) && matchesBoardSearch(job, query)
  );
  const dayCounts = useMemo(() => countJobsByWeekday(board.jobs, todayKey), [board.jobs, todayKey]);

  const selected = analysed.find(({ job }) => job.id === selection.jobId) ?? null;
  const rule = selected?.job.rules.find((item) => item.id === selection.ruleId) ?? null;
  const mode: InspectorMode = selection.mode === "rule" && !rule ? "job" : selection.mode;

  const selectJob = (jobId: string) => setSelection({ jobId, mode: "job", ruleId: null });
  const clearSelection = () => setSelection({ jobId: null, mode: "job", ruleId: null });
  const openRule = (jobId: string, ruleId: string) => {
    const target = board.jobs.find((job) => job.id === jobId)?.rules.find((item) => item.id === ruleId);
    if (!target) return;
    setFormState(ruleToForm(target, todayKey));
    setSelection({ jobId, mode: "rule", ruleId });
  };
  const openNew = (jobId: string, frequency: RuleFrequency, weekday: number | null) => {
    setFormState(newRuleForm(frequency, weekday, todayKey));
    setSelection({ jobId, mode: "new", ruleId: null });
  };
  const setForm = (patch: Partial<RuleFormState>) => setFormState((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (!selected || ruleFormError(form)) return false;
    try {
      if (mode === "new") {
        await mutations.create({ form, jobId: selected.job.id });
        selectJob(selected.job.id);
      } else if (rule) {
        await mutations.update({ form, rule });
      }
      return true;
    } catch {
      return false;
    }
  };

  const removeRule = async () => {
    if (!rule) return;
    try {
      await mutations.remove(rule);
      if (selected) selectJob(selected.job.id);
    } catch {
      // El hook ya avisa el error.
    }
  };

  return {
    board,
    clearSelection,
    counts,
    dayCounts,
    filter,
    form,
    formError: mode === "job" ? "" : ruleFormError(form),
    mode,
    mutations,
    openNew,
    openRule,
    query,
    removeRule,
    rows,
    rule,
    save,
    selectJob,
    selected,
    setFilter,
    setForm,
    setQuery,
    todayKey,
  };
};

export type ScheduleRulesController = ReturnType<typeof useScheduleRulesController>;
