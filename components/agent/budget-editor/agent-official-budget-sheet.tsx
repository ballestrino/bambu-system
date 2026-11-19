"use client";

import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";

import { AgentDetailBody } from "@/components/agent/budget-editor/agent-detail-body";
import { formatDetailDate } from "@/components/budgets/budget-details/budget-detail-model";
import {
  buildOfficialDetailOption,
  officialContributions,
  officialServiceFacts,
  officialStats,
  pickOfficialOptions,
} from "@/components/official-budgets/official-budget-model";
import { useOfficialBudget } from "@/components/official-budgets/hooks/use-official-budgets";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getOfficialBudgetUrl } from "@/lib/agent/proposals";

function OfficialBudgetBody({ id }: { id: string }) {
  const query = useOfficialBudget(id);
  const budget = query.data;
  // La versión vigente: la primera (las versiones vienen de la más nueva).
  const version = budget?.versions[0];
  const picked = version ? pickOfficialOptions(version.options) : null;
  const main = picked ? (picked.base ?? picked.first) : null;
  const status = budget ? (budget.status === "ACTIVE" ? "vigente" : "archivado") : null;

  return (
    <>
      <SheetHeader className="flex-row items-start gap-2 border-b px-4 py-3 text-left">
        <div className="min-w-0 flex-1 space-y-1">
          <SheetTitle className="truncate">{version?.serviceName ?? "Presupuesto oficial"}</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {version
              ? `Oficial ${status} · versión ${version.version}, publicada el ${formatDetailDate(version.publishedAt)}`
              : "Presupuesto oficial · solo lectura"}
          </SheetDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="-mt-1 h-11 shrink-0 sm:h-9">
          <Link href={getOfficialBudgetUrl(id)}>
            Página
            <ArrowUpRight aria-hidden />
          </Link>
        </Button>
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
            <p className="text-destructive">No pudimos cargar el presupuesto oficial.</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {budget && !main && <p className="text-sm text-ops-text-muted">Esta versión no tiene opciones.</p>}
        {picked && main && (
          <AgentDetailBody
            stats={officialStats(main)}
            buildOptions={(withIva) =>
              [picked.base, picked.products].flatMap((option) => (option ? [buildOfficialDetailOption(option, withIva)] : []))
            }
            facts={officialServiceFacts(main, picked.products)}
            contributions={officialContributions(main)}
          />
        )}
      </div>
    </>
  );
}

// Un presupuesto oficial que mostró el agente, abierto encima del hilo como
// los guardados: Abrir no saca de la conversación. "Página" lleva a la página
// completa, con las versiones anteriores.
export function AgentOfficialBudgetSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <Sheet open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl [&>button]:hidden">
        {id && <OfficialBudgetBody key={id} id={id} />}
      </SheetContent>
    </Sheet>
  );
}
