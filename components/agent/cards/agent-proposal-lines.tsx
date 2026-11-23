import { AlertTriangle, ChevronDown, type LucideIcon } from "lucide-react";

import { clashLabel } from "@/components/agent/cards/proposal-copy";
import { cn } from "@/lib/utils";

// Las dos formas plegadas de una propuesta (feature 69). Con lugar todo va en
// una línea; en el teléfono (el hilo angosto) las acciones bajan a una
// segunda fila que ocupa el ancho.

export function FoldChevron({ open, onClick, label }: { open: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={label ?? (open ? "Plegar la propuesta" : "Desplegar la propuesta")}
      title={open ? "Plegar" : "Desplegar"}
      className="-my-1.5 grid size-11 shrink-0 place-items-center rounded-[10px] text-ops-text-muted hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:size-[34px]"
    >
      <ChevronDown className={cn("size-[18px] transition-transform", open && "rotate-180")} aria-hidden />
    </button>
  );
}

// Lo que avisa una plegada: visitas que se cruzan o avisos. Despliega.
export function FoldMarker({ clashes, warnings, onUnfold }: { clashes: number; warnings: number; onUnfold: () => void }) {
  if (!clashes && !warnings) return null;
  const label = clashes ? clashLabel(clashes) : String(warnings);
  return (
    <button
      type="button"
      onClick={onUnfold}
      aria-label={clashes ? `${label}: ver la visita` : `${warnings === 1 ? "1 aviso" : `${warnings} avisos`}: ver el detalle`}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
    >
      <AlertTriangle className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

function LineIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: "bamboo" | "muted" | "warning" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg",
        tone === "bamboo" && "bg-ops-bamboo-soft text-ops-bamboo-strong",
        tone === "muted" && "bg-ops-surface-muted text-ops-text-muted",
        tone === "warning" && "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
      )}
    >
      <Icon className="size-[15px]" />
    </span>
  );
}

// El nombre y lo que va después: en una línea con lugar, en dos sin él. Con
// poco lugar se acorta primero el nombre: la cifra es lo que se mira.
function LineText({ title, detail, note }: { title: string; detail: string | null; note?: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 text-sm leading-snug tabular-nums">
      <p className="min-w-0 @lg/thread:flex @lg/thread:items-baseline">
        <span className="block truncate font-semibold @lg/thread:min-w-0">{title}</span>
        {detail && (
          <span className="block truncate text-[12.5px] text-ops-text-muted @lg/thread:max-w-[70%] @lg/thread:shrink-0 @lg/thread:text-sm">
            <span className="hidden @lg/thread:inline">&nbsp;·&nbsp;</span>
            {detail}
          </span>
        )}
      </p>
      {note && <div className="mt-0.5 text-xs leading-snug">{note}</div>}
    </div>
  );
}

// Una pendiente plegada: nombre, cifra clave, el aviso y sus acciones.
export function FoldedProposalLine({
  icon,
  title,
  figure,
  marker,
  actions,
  chevron,
}: {
  icon: LucideIcon;
  title: string;
  figure: string | null;
  marker: React.ReactNode;
  actions: React.ReactNode;
  chevron: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 py-2 pr-1.5 pl-3 @lg/thread:flex-nowrap">
      <LineIcon icon={icon} tone="bamboo" />
      <LineText title={title} detail={figure} />
      {marker}
      <div className="order-last flex w-full gap-2 @lg/thread:order-none @lg/thread:w-auto">{actions}</div>
      {chevron}
    </div>
  );
}

// Una resuelta: qué pasó, dónde quedó y, si venció o falló, pedirla de nuevo.
export function ProposalReceiptLine({
  icon,
  tone,
  title,
  detail,
  note,
  actions,
  chevron,
}: {
  icon: LucideIcon;
  tone: "bamboo" | "muted" | "warning";
  title: string;
  detail: string | null;
  note?: React.ReactNode;
  actions?: React.ReactNode;
  chevron: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 pr-1.5 pl-3">
      <LineIcon icon={icon} tone={tone} />
      <LineText title={title} detail={detail} note={note} />
      {actions}
      {chevron}
    </div>
  );
}
