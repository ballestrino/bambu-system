"use client";

import { useNewWebFormsCount } from "@/components/web-forms/hooks/use-web-forms";
import { cn } from "@/lib/utils";

// Cuántos formularios web nuevos hay, al lado de "Formularios". Sin nuevos (o
// si la lectura falla) no muestra nada.
export function WebFormsNavBadge({ className }: { className?: string }) {
  const { data } = useNewWebFormsCount();
  if (!data) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ops-bamboo px-1.5 text-[11px] font-semibold tabular-nums text-white",
        className
      )}
      aria-label={data === 1 ? "1 formulario nuevo" : `${data} formularios nuevos`}
    >
      {data > 99 ? "99+" : data}
    </span>
  );
}
