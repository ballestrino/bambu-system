"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { saveAgentFlag, useAgentFlag } from "@/components/agent/agent-browser-flags";
import { cn } from "@/lib/utils";

// "Plegar las propuestas" en el "…" de la conversación: un ítem con casilla
// (menuitemcheckbox) que se dibuja como un switch. El menú queda abierto al
// tocarlo: se ve el cambio en las tarjetas de atrás.
export function AgentFoldProposalsItem() {
  const folded = useAgentFlag("foldProposals");
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={folded}
      onCheckedChange={(checked) => saveAgentFlag("foldProposals", checked === true)}
      onSelect={(event) => event.preventDefault()}
      className="flex min-h-11 cursor-default items-center gap-3 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground sm:min-h-0"
    >
      <span className="min-w-0 flex-1">
        <span className="block">Plegar las propuestas</span>
        <span className="block text-xs text-ops-text-muted">Una línea, con sus acciones</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "inline-flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors",
          folded ? "bg-ops-bamboo-strong" : "bg-ops-text-muted/60"
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full bg-white shadow-sm transition-transform",
            folded ? "translate-x-3.5" : "translate-x-0"
          )}
        />
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
