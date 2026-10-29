"use client";

import Link from "next/link";
import { BadgeCheck, Copy, Loader2, Pencil, Send } from "lucide-react";

import { BudgetDropdown } from "@/components/budgets/BudgetDropdown";
import { useDuplicateBudgetMutation } from "@/components/budgets/hooks/useDuplicateBudgetMutation";
import type { GeneratorBudgetListItem } from "@/components/budgets/interfaces/generator-budget";
import { useOfficialBudgetMutations } from "@/components/official-budgets/hooks/use-official-budget-mutations";
import { cn } from "@/lib/utils";

const iconButton =
  "grid size-10 shrink-0 place-items-center rounded-[10px] text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text disabled:opacity-50";
const labeledButton =
  "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-ops-border bg-ops-surface text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

// Estado de la fila: oficial con su versión (lleva al oficial) o borrador.
export const BudgetStatusBadge = ({ budget }: { budget: GeneratorBudgetListItem }) =>
  budget.officialBudget ? (
    <Link
      className="inline-flex h-[26px] items-center gap-1 whitespace-nowrap rounded-full border border-ops-bamboo/35 bg-ops-bamboo-soft px-2.5 text-xs font-semibold text-ops-bamboo-strong hover:bg-ops-bamboo-soft/70"
      href={`/dashboard/official-budgets/${budget.officialBudget.id}`}
    >
      <BadgeCheck className="size-3.5" />
      Oficial v{budget.officialBudget.currentVersion}
    </Link>
  ) : (
    <span className="inline-flex h-[26px] items-center rounded-full border border-ops-border px-2.5 text-xs font-semibold text-ops-text-muted">
      Borrador
    </span>
  );

// Acciones de un toque: editar, duplicar y publicar; eliminar queda en el menú.
export const BudgetRowActions = ({ budget, labeled = false }: { budget: GeneratorBudgetListItem; labeled?: boolean }) => {
  const { duplicateBudget, isDuplicating } = useDuplicateBudgetMutation();
  const { publish } = useOfficialBudgetMutations();
  const isPublishing = publish.isPending && publish.variables === budget.id;
  const buttonClass = labeled ? labeledButton : iconButton;

  return (
    <div className={cn("flex items-center", labeled ? "gap-2" : "justify-end gap-0.5")}>
      <Link aria-label={`Editar ${budget.name}`} className={buttonClass} href={`/dashboard/budgets/edit/${budget.slug}`}>
        <Pencil className="size-4" />
        {labeled ? "Editar" : null}
      </Link>
      <button
        aria-label={`Duplicar ${budget.name}`}
        className={buttonClass}
        disabled={isDuplicating}
        onClick={() => duplicateBudget(budget.id)}
        type="button"
      >
        {isDuplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
        {labeled ? "Duplicar" : null}
      </button>
      {budget.officialBudget ? null : (
        <button
          aria-label={`Publicar ${budget.name} como oficial`}
          className={buttonClass}
          disabled={publish.isPending}
          onClick={() => publish.mutate(budget.id)}
          title="Publicar como oficial"
          type="button"
        >
          {isPublishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {labeled ? "Publicar" : null}
        </button>
      )}
      <BudgetDropdown budget={budget} />
    </div>
  );
};
