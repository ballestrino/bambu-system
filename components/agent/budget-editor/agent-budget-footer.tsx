"use client";

import { ExternalLink, Loader2, Pencil, Save } from "lucide-react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";

import { formatMoney } from "@/components/agent/format";
import { Button } from "@/components/ui/button";
import type { ProposalResult } from "@/lib/agent/proposals";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

export type BudgetEditorStatus =
  | { kind: "editable" }
  | { kind: "executing" }
  | { kind: "saved"; result: ProposalResult | null };

// Los finales con IVA del formulario, siempre a la vista mientras se edita.
function Finals() {
  const { control } = useFormContext<BudgetFormValues>();
  const values = useWatch({ control }) as BudgetFormValues;
  const totals = calculateBudgetTotals(values);
  return (
    <div className="min-w-0 text-xs text-muted-foreground tabular-nums">
      <p>
        Sin productos <span className="font-semibold text-foreground">{formatMoney(totals.finalPriceService)}</span>
      </p>
      {totals.products > 0 && (
        <p>
          Con productos <span className="font-semibold text-foreground">{formatMoney(totals.totalFinalWithProducts)}</span>
        </p>
      )}
      <p>Precios con IVA, por mes.</p>
    </div>
  );
}

// El pie del editor: Guardar en el generador o, ya guardado, los links al
// presupuesto en el generador.
export function AgentBudgetFooter({
  status,
  saving,
  error,
  onSave,
}: {
  status: BudgetEditorStatus;
  saving: boolean;
  error: string | null;
  onSave: () => void;
}) {
  if (status.kind === "saved") {
    const { result } = status;
    return (
      <div className="flex flex-col gap-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 text-sm">
          Guardado en el generador{result ? `: ${result.label}` : "."}
        </p>
        {result?.slug && (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="h-11 flex-1 sm:h-9">
              <Link href={result.url}>
                <ExternalLink aria-hidden /> Abrir
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 flex-1 sm:h-9">
              <Link href={`/dashboard/budgets/edit/${result.slug}`}>
                <Pencil aria-hidden /> Editar en el generador
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const busy = saving || status.kind === "executing";
  return (
    <div className="space-y-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Finals />
        <Button className="ml-auto h-11 shrink-0 sm:h-9" disabled={busy} onClick={onSave}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {busy ? "Guardando…" : "Guardar en el generador"}
        </Button>
      </div>
    </div>
  );
}
