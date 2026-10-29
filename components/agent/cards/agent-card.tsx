import { ArrowUpRight, ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

// El marco común de las tarjetas del agente, como en el diseño: el ícono en
// un cuadro verde claro, título y subtítulo, algo a la derecha (un link o el
// estado) y un pie opcional con fondo (las acciones de una propuesta).
// Compacto, para un Sheet de 600px y para 390px en el teléfono.
//
// collapsed: la tarjeta arranca plegada, solo con el título y el subtítulo
// (el conteo), y se despliega con un toque. Las listas van así para no llenar
// el hilo (pedido del usuario, feature 33).
export function AgentCard({
  icon: Icon,
  title,
  subtitle,
  aside,
  footer,
  collapsed,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const header = (
    <>
      <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-ops-bamboo-soft text-ops-bamboo-strong">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm leading-[1.35] font-semibold text-pretty break-words">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs leading-snug break-words text-ops-text-muted">{subtitle}</p>}
      </div>
      {aside}
    </>
  );
  const body = (
    <>
      <div className="space-y-3 px-3.5 pt-0.5 pb-3.5 text-sm">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center gap-3 border-t border-ops-border bg-ops-canvas px-3.5 py-2.5">
          {footer}
        </footer>
      )}
    </>
  );
  const frame = cn("overflow-hidden rounded-[14px] border border-ops-border bg-ops-surface text-card-foreground", className);

  if (collapsed) {
    return (
      <details className={cn("group/card", frame)}>
        <summary className="flex cursor-pointer list-none items-start gap-2.5 px-3.5 py-3 select-none [&::-webkit-details-marker]:hidden">
          {header}
          <ChevronDown
            className="mt-1.5 size-4 shrink-0 text-ops-text-muted transition-transform group-open/card:rotate-180"
            aria-hidden
          />
        </summary>
        {body}
      </details>
    );
  }
  return (
    <section className={frame}>
      <header className="flex items-start gap-2.5 px-3.5 py-3">{header}</header>
      {body}
    </section>
  );
}

// "Abrir ↗" arriba a la derecha de una tarjeta.
export function CardOpenLink({ href, children = "Abrir" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-0.5 py-1 text-xs font-semibold text-ops-bamboo-strong underline-offset-4 hover:underline"
    >
      {children}
      <ArrowUpRight className="size-[13px]" aria-hidden />
    </Link>
  );
}

// Una fila etiqueta / valor con números alineados.
export function CardRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-ops-text-muted">{label}</span>
      <span className={cn("text-right tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

// Una nota de la tarjeta. La de aviso va en un recuadro ámbar, como el aviso
// de un trabajo vinculado en el diseño.
export function CardNote({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warning" }) {
  return (
    <p
      className={cn(
        "text-xs leading-snug",
        tone === "warning"
          ? "rounded-[10px] bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
          : "text-ops-text-muted"
      )}
    >
      {children}
    </p>
  );
}
