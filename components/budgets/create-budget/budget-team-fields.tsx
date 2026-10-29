"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CalendarDays, Clock3, Minus, Plus } from "lucide-react";

import { NominalHourSelector } from "@/components/budgets/common/NominalHourSelector";
import { formatBudgetNumber } from "@/components/budgets/create-budget/budget-summary-model";
import { CreatorAffixInput, CreatorField, CreatorSegmented } from "@/components/budgets/create-budget/creator-ui";
import { FormField } from "@/components/ui/form";
import { calculateEffectiveVisits } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

const FREQUENCIES: { label: string; value: BudgetFormValues["visit_type"] }[] = [
  { label: "Por día", value: "days" },
  { label: "Semanal", value: "week" },
  { label: "Mensual", value: "month" },
];

const VISIT_SUFFIX: Record<BudgetFormValues["visit_type"], string> = {
  days: "días al mes",
  month: "por mes",
  week: "por semana",
};

const stepperButton =
  "grid h-full w-11 shrink-0 place-items-center text-ops-text hover:bg-ops-surface-muted disabled:opacity-40";

export const BudgetTeamFields = () => {
  const { control, register, setValue } = useFormContext<BudgetFormValues>();
  const [visitType, visits, hours, employees] = useWatch({
    control,
    name: ["visit_type", "visits", "hours_per_visit", "employees"],
  });
  const people = Math.max(1, Number(employees) || 1);
  const effectiveVisits = calculateEffectiveVisits(Number(visits) || 0, visitType ?? "week");
  const totalHours = effectiveVisits * (Number(hours) || 0) * people;
  const changePeople = (delta: number) =>
    setValue("employees", Math.max(1, people + delta), { shouldDirty: true, shouldValidate: true });

  return (
    <div className="flex flex-col gap-4">
      <CreatorField label="Frecuencia">
        <Controller
          control={control}
          name="visit_type"
          render={({ field }) => (
            <CreatorSegmented label="Frecuencia" onChange={field.onChange} options={FREQUENCIES} value={field.value} />
          )}
        />
      </CreatorField>
      <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CreatorField htmlFor="budget-visits" label="Visitas">
          <CreatorAffixInput
            id="budget-visits"
            inputMode="decimal"
            min={0}
            suffix={VISIT_SUFFIX[visitType ?? "week"]}
            type="number"
            {...register("visits", { valueAsNumber: true })}
          />
        </CreatorField>
        <CreatorField htmlFor="budget-hours" label="Horas por visita">
          <CreatorAffixInput
            id="budget-hours"
            inputMode="decimal"
            min={0}
            step="0.5"
            suffix="hs"
            type="number"
            {...register("hours_per_visit", { valueAsNumber: true })}
          />
        </CreatorField>
        <CreatorField label="Empleados">
          <div className="flex h-11 items-center overflow-hidden rounded-[10px] border border-ops-border bg-ops-surface">
            <button aria-label="Quitar un empleado" className={stepperButton} disabled={people <= 1} onClick={() => changePeople(-1)} type="button">
              <Minus className="size-4" />
            </button>
            <span className="flex-1 text-center text-[15px] font-semibold tabular-nums text-ops-text">{people}</span>
            <button aria-label="Sumar un empleado" className={stepperButton} onClick={() => changePeople(1)} type="button">
              <Plus className="size-4" />
            </button>
          </div>
        </CreatorField>
        <FormField
          control={control}
          name="nominal_hour"
          render={({ field, fieldState }) => (
            <NominalHourSelector
              error={fieldState.error?.message}
              label="Hora nominal"
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-ops-canvas px-3.5 py-3 text-[13.5px] text-ops-text-muted dark:bg-ops-surface-muted">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" />
          {visitType === "week" ? "≈ " : ""}
          {formatBudgetNumber(effectiveVisits)} visitas en el mes
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 className="size-4" />
          <strong className="font-semibold tabular-nums text-ops-text">{formatBudgetNumber(totalHours)} hs</strong>
          en el mes entre {people} {people === 1 ? "persona" : "personas"}
        </span>
      </div>
    </div>
  );
};
