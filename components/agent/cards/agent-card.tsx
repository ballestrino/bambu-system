import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// El marco común de las tarjetas del agente: compacto, para un Sheet de 600px
// y para 390px en el teléfono.
export function AgentCard({
  icon: Icon,
  title,
  subtitle,
  aside,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border bg-card text-card-foreground shadow-xs", className)}>
      <header className="flex items-start gap-2 border-b px-3 py-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{title}</h3>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-3 px-3 py-2 text-sm">{children}</div>
    </section>
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
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

export function CardNote({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warning" }) {
  return (
    <p
      className={cn(
        "text-xs",
        tone === "warning" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
      )}
    >
      {children}
    </p>
  );
}
