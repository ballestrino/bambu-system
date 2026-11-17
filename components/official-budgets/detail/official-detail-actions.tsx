"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ClipboardCopy, SquarePen } from "lucide-react";

import { copyOfficialPrices, OfficialArchiveDialog } from "@/components/official-budgets/official-archive-dialog";
import { officialPricesText } from "@/components/official-budgets/official-budget-model";
import type { OfficialBudgetDetailDto, OfficialBudgetVersionDto } from "@/components/official-budgets/types";

const outlineAction =
  "inline-flex h-11 items-center gap-[7px] rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

// Las acciones de un oficial: ir al generador (donde se edita y se publica la
// versión siguiente), copiar los precios de la versión que se ve y archivar.
export const OfficialDetailActions = ({ budget, version }: { budget: OfficialBudgetDetailDto; version: OfficialBudgetVersionDto }) => {
  const [archiving, setArchiving] = useState(false);
  const copy = () => void copyOfficialPrices(officialPricesText(version.serviceName, version.version, version.options));

  return (
    <div className="flex flex-wrap gap-2">
      <button className={outlineAction} onClick={copy} type="button">
        <ClipboardCopy className="size-[15px]" />
        Copiar precios
      </button>
      {budget.status === "ACTIVE" ? (
        <button className={`${outlineAction} text-destructive hover:text-destructive`} onClick={() => setArchiving(true)} type="button">
          <Archive className="size-[15px]" />
          Archivar y desvincular
        </button>
      ) : null}
      {budget.sourceBudget ? (
        <Link
          className="inline-flex h-11 items-center gap-[7px] rounded-[10px] bg-ops-bamboo-strong px-[18px] text-[13.5px] font-semibold text-ops-surface hover:bg-ops-bamboo-strong/90"
          href={`/dashboard/budgets/budget/${budget.sourceBudget.slug}`}
        >
          <SquarePen className="size-[15px]" />
          Abrir generador
        </Link>
      ) : null}
      <OfficialArchiveDialog id={budget.id} name={budget.sourceBudgetName} onOpenChange={setArchiving} open={archiving} />
    </div>
  );
};
