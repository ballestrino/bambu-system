"use client";

import { PanelRight } from "lucide-react";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import { cn } from "@/lib/utils";

// "Abrir" de un presupuesto guardado en una tarjeta: lo abre en el Sheet del
// chat, sin salir de la conversación. Como texto (variant "text") va en una
// fila de una lista.
export function AgentOpenBudgetButton({
  slug,
  children = "Abrir",
  variant = "link",
  className,
}: {
  slug: string;
  children?: React.ReactNode;
  variant?: "link" | "text";
  className?: string;
}) {
  const { openSavedBudget } = useAgentChatContext();
  return (
    <button
      type="button"
      onClick={(event) => {
        // Dentro de una tarjeta plegable no la pliega.
        event.preventDefault();
        openSavedBudget(slug);
      }}
      className={cn(
        variant === "link"
          ? "inline-flex shrink-0 items-center gap-1 py-1 text-xs font-semibold text-ops-bamboo-strong underline-offset-4 hover:underline"
          : "block max-w-full truncate text-left underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
      {variant === "link" && <PanelRight className="size-[13px]" aria-hidden />}
    </button>
  );
}
