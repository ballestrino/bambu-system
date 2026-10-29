"use client";

import { useState, type ReactNode } from "react";

import { CreatorAffixInput } from "@/components/budgets/create-budget/creator-ui";

type BudgetCommitInputProps = {
  disabled?: boolean;
  id: string;
  onCommit: (value: number) => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
  value: number;
};

// Un número que se aplica al salir del campo o con Enter: así los precios
// objetivo no recalculan la ganancia con cada tecla.
export const BudgetCommitInput = ({ disabled, id, onCommit, prefix, suffix, value }: BudgetCommitInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "";

  return (
    <CreatorAffixInput
      className="text-base font-semibold"
      disabled={disabled}
      id={id}
      inputMode="decimal"
      min={0}
      onBlur={(event) => {
        const next = event.currentTarget.valueAsNumber;
        const changed = draft !== null && draft !== formatted;
        setDraft(null);
        if (changed && Number.isFinite(next)) onCommit(next);
      }}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={(event) => setDraft(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        event.currentTarget.blur();
      }}
      prefix={prefix}
      step="0.01"
      suffix={suffix}
      type="number"
      value={draft ?? formatted}
    />
  );
};
