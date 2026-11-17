"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ClipboardCopy, MoreHorizontal, SquarePen } from "lucide-react";

import { copyOfficialPrices, OfficialArchiveDialog } from "@/components/official-budgets/official-archive-dialog";
import { officialPricesText } from "@/components/official-budgets/official-budget-model";
import type { OfficialBudgetRowDto } from "@/components/official-budgets/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const iconButton =
  "grid size-10 shrink-0 place-items-center rounded-[10px] text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text disabled:opacity-50";
const labeledButton =
  "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-ops-border bg-ops-surface text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

// Abrir el generador, copiar los precios y, en el menú, archivar.
export const OfficialRowActions = ({ budget, labeled = false }: { budget: OfficialBudgetRowDto; labeled?: boolean }) => {
  const [archiving, setArchiving] = useState(false);
  const buttonClass = labeled ? labeledButton : iconButton;
  const copy = () => void copyOfficialPrices(officialPricesText(budget.sourceBudgetName, budget.currentVersion, budget.options));

  return (
    <div className={cn("flex items-center", labeled ? "gap-2" : "justify-end gap-0.5")}>
      {budget.sourceBudget ? (
        <Link
          aria-label={`Abrir el generador de ${budget.sourceBudgetName}`}
          className={buttonClass}
          href={`/dashboard/budgets/budget/${budget.sourceBudget.slug}`}
          title="Abrir generador"
        >
          <SquarePen className="size-4" />
          {labeled ? "Generador" : null}
        </Link>
      ) : null}
      <button aria-label={`Copiar los precios de ${budget.sourceBudgetName}`} className={buttonClass} onClick={copy} title="Copiar precios" type="button">
        <ClipboardCopy className="size-4" />
        {labeled ? "Copiar precios" : null}
      </button>
      {budget.status === "ACTIVE" ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label={`Más acciones de ${budget.sourceBudgetName}`} className={labeled ? `${labeledButton} max-w-11` : iconButton} type="button">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setArchiving(true)} variant="destructive">
                <Archive className="size-4" />
                Archivar y desvincular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <OfficialArchiveDialog id={budget.id} name={budget.sourceBudgetName} onOpenChange={setArchiving} open={archiving} />
        </>
      ) : null}
    </div>
  );
};
