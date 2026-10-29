import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const outlineButton =
  "inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted";

const StateMessage = ({ action, description, title }: { action?: ReactNode; description: string; title: string }) => (
  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
    <p className="text-[15px] font-semibold text-ops-text">{title}</p>
    <p className="max-w-md text-[13.5px] text-ops-text-muted">{description}</p>
    {action ? <div className="mt-2">{action}</div> : null}
  </div>
);

export const BudgetsLoading = () => (
  <div className="flex flex-col gap-3 p-4">
    {[1, 2, 3, 4, 5].map((item) => (
      <Skeleton className="h-14 w-full rounded-xl" key={item} />
    ))}
  </div>
);

export const BudgetsError = ({ onRetry }: { onRetry: () => void }) => (
  <StateMessage
    action={<button className={outlineButton} onClick={onRetry} type="button">Reintentar</button>}
    description="Revisá la conexión y volvé a intentar."
    title="No pudimos cargar los presupuestos"
  />
);

// Sin resultados por los filtros no es lo mismo que no tener presupuestos.
export const BudgetsEmpty = ({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) =>
  hasFilters ? (
    <StateMessage
      action={<button className={outlineButton} onClick={onClear} type="button">Limpiar filtros</button>}
      description="Probá con otra búsqueda o sacá algún filtro."
      title="Ningún presupuesto coincide"
    />
  ) : (
    <StateMessage
      action={
        <Link className={outlineButton} href="/dashboard/budgets/create">
          <Plus className="size-4" />
          Nuevo presupuesto
        </Link>
      }
      description="Armá el primero y el precio se calcula mientras lo cargás."
      title="Todavía no hay presupuestos"
    />
  );
