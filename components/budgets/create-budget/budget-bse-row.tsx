"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Calculator } from "lucide-react";
import { toast } from "sonner";

import { formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { CreatorAffixInput, creatorOutlineButtonClass } from "@/components/budgets/create-budget/creator-ui";
import { applyBseKeepingPrice, BSE_DEFAULT_LABEL, BSE_KEEP_PRICE_ERRORS, hasBse } from "@/lib/budget-bse";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

const setOptions = { shouldDirty: true, shouldValidate: true } as const;

// El BSE va con los aportes: un % del sueldo nominal que se suma al costo. Un
// presupuesto guardado antes del BSE lo tiene en null y ofrece calcularlo
// sacándolo de la ganancia, con el mismo precio.
export const BudgetBseRow = ({ amount }: { amount: number }) => {
  const { control, getValues, register, setValue } = useFormContext<BudgetFormValues>();
  const bse = useWatch({ control, name: "bse_contribution" });

  const calculate = () => {
    const result = applyBseKeepingPrice(getValues());
    if (!result.ok) {
      toast.error(BSE_KEEP_PRICE_ERRORS[result.reason]);
      return;
    }
    setValue("bse_contribution", result.values.bse_contribution, setOptions);
    setValue("revenue_percent", result.values.revenue_percent, setOptions);
    toast.success(`BSE de ${formatBudgetMoney(result.bseAmount)} sacado de la ganancia. El precio no cambió.`);
  };

  if (!hasBse(bse)) {
    return (
      <div className="flex flex-wrap items-center gap-3 border-t border-ops-border px-3.5 py-3">
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-semibold text-ops-text">BSE</p>
          <p className="text-[12.5px] text-ops-text-muted">
            Sin calcular: el presupuesto es de antes del BSE. Calcularlo pone {BSE_DEFAULT_LABEL} del sueldo nominal y lo saca de
            la ganancia, sin cambiar el precio.
          </p>
        </div>
        <button className={creatorOutlineButtonClass} onClick={calculate} type="button">
          <Calculator className="size-4" />
          Calcular BSE
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-ops-border px-3.5 py-3">
      <div className="min-w-[180px] flex-1 sm:pl-[52px]">
        <p className="text-sm font-semibold text-ops-text">BSE</p>
        <p className="text-[12.5px] text-ops-text-muted">Seguro de accidentes, sobre el sueldo nominal (horas × hora nominal). Se suma al costo.</p>
      </div>
      <CreatorAffixInput
        aria-label="Porcentaje de BSE"
        inputMode="decimal"
        min={0}
        step="0.001"
        suffix="%"
        type="number"
        wrapperClassName="w-[110px]"
        {...register("bse_contribution", { setValueAs: (value) => (value === "" ? 0 : Number(value)) })}
      />
      <span className="w-[84px] text-right text-sm font-semibold tabular-nums text-ops-text">{formatBudgetMoney(amount)}</span>
    </div>
  );
};
