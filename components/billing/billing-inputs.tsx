"use client";

import type { ComponentProps } from "react";

import { formatMoney, parseMoneyInput } from "@/components/billing/billing-format";
import { cn } from "@/lib/utils";

type CommitProps = Omit<ComponentProps<"input">, "defaultValue" | "onBlur" | "value"> & {
  // false: el valor no sirve y el campo vuelve al guardado.
  onCommit: (value: string) => boolean | void;
  value: string;
};

// Un campo que guarda al salir o con Enter, y vuelve al valor guardado con
// Escape. El `key` del valor lo reinicia cuando llega uno nuevo del servidor.
export const CommitInput = ({ onCommit, value, ...props }: CommitProps) => (
  <input
    {...props}
    defaultValue={value}
    key={value}
    onBlur={(event) => {
      const next = event.currentTarget.value.trim();
      if (next !== value && onCommit(next) === false) event.currentTarget.value = value;
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter") event.currentTarget.blur();
      if (event.key === "Escape") {
        event.currentTarget.value = value;
        event.currentTarget.blur();
      }
    }}
  />
);

export const detailInputClass =
  "-ml-1.5 w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-ops-text outline-none hover:border-ops-border hover:bg-ops-surface focus:border-ops-bamboo focus:bg-ops-surface focus:ring-3 focus:ring-ops-bamboo/20 disabled:hover:border-transparent disabled:hover:bg-transparent";

export const amountInputClass =
  "w-28 rounded-[10px] border border-ops-border bg-ops-surface px-2.5 py-2 text-right text-sm font-semibold tabular-nums text-ops-text outline-none focus:border-ops-bamboo focus:ring-3 focus:ring-ops-bamboo/20 disabled:opacity-60";

// Monto en pesos: muestra "$ 24.400" y guarda el número. Uno ilegible vuelve
// al anterior.
export const AmountInput = ({
  amount,
  className,
  currency,
  onCommit,
  ...props
}: Omit<CommitProps, "onCommit" | "value"> & { amount: number; currency: string; onCommit: (amount: number) => void }) => {
  const text = formatMoney(amount, currency);
  return (
    <CommitInput
      {...props}
      className={cn(amountInputClass, className)}
      inputMode="decimal"
      onCommit={(next) => {
        const parsed = parseMoneyInput(next);
        if (parsed === null || parsed === amount) return false;
        onCommit(parsed);
      }}
      value={text}
    />
  );
};
