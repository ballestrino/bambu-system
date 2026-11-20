"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";

import { savedBudgetQuery } from "@/components/agent/queries";
import { AgentValuesDetail } from "@/components/agent/budget-editor/agent-detail-body";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// La opción sin productos y la con productos, con el diseño de la página del
// presupuesto. Uno que solo guardó la de productos muestra el servicio desde ella.
function SavedBudgetDetail({ options }: { options: { hasProducts: boolean; values: BudgetFormValues }[] }) {
  const products = options.find((option) => option.hasProducts)?.values ?? null;
  const base = options.find((option) => !option.hasProducts)?.values ?? products;
  return base ? <AgentValuesDetail base={base} products={products} /> : null;
}

function SavedBudgetBody({ slug }: { slug: string }) {
  const query = useQuery(savedBudgetQuery(slug));
  const budget = query.data;
  return (
    <>
      <SheetHeader className="flex-row items-start gap-2 border-b px-4 py-3 text-left">
        <div className="min-w-0 flex-1 space-y-1">
          <SheetTitle className="truncate">{budget?.name ?? "Presupuesto"}</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {budget?.description || "Presupuesto guardado · solo lectura"}
          </SheetDescription>
        </div>
        {budget && (
          <Button asChild variant="ghost" size="sm" className="-mt-1 h-11 shrink-0 sm:h-9">
            <Link href={budget.url}>
              Página
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        )}
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-11 shrink-0 sm:size-9" aria-label="Cerrar">
            <X aria-hidden />
          </Button>
        </SheetClose>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {query.isPending && <Skeleton className="h-96 w-full rounded-xl" />}
        {query.isError && (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">{query.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {budget && <SavedBudgetDetail options={budget.options} />}
      </div>
    </>
  );
}

// Un presupuesto guardado que mostró el agente, abierto encima del hilo con el
// detalle de su página: Abrir no saca de la conversación. "Página" lleva a la
// página completa.
export function AgentSavedBudgetSheet({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  return (
    <Sheet open={slug !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl [&>button]:hidden">
        {slug && <SavedBudgetBody key={slug} slug={slug} />}
      </SheetContent>
    </Sheet>
  );
}
