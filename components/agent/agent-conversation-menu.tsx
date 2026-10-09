"use client";

import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useRef } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ConversationAction = "pin" | "rename" | "delete";

// Lo que se hace con el botón del menú: renombrar y borrar le devuelven el
// foco al cerrar su diálogo.
export type ConversationActionHandler = (action: ConversationAction, trigger: HTMLElement | null) => void;

// El "…" de una conversación: Fijar (o Desfijar), Renombrar y Borrar, más las
// opciones que agregue quien lo usa (la cabecera suma Nueva conversación y
// Costos de IA). Una conversación que todavía no se guardó (pinned null) solo
// tiene esas. La acción elegida corre recién cuando el menú terminó de
// cerrarse: si no, el menú recupera el foco al cerrarse y el diálogo queda sin
// foco.
export function AgentConversationMenu({
  pinned,
  onAction,
  children,
  extraItems,
  align = "end",
}: {
  pinned: boolean | null;
  onAction: ConversationActionHandler;
  // El botón que abre el menú.
  children: React.ReactElement;
  extraItems?: { label: string; icon: React.ReactNode; onSelect: () => void }[];
  align?: "start" | "end";
}) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const queue = (run: () => void) => {
    pending.current = run;
  };
  const queueAction = (action: ConversationAction) => queue(() => onAction(action, triggerRef.current));

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild ref={(node) => void (triggerRef.current = node)}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="min-w-44 rounded-xl"
        onCloseAutoFocus={(event) => {
          const run = pending.current;
          pending.current = null;
          if (!run) return;
          event.preventDefault();
          run();
        }}
      >
        {extraItems?.map((item) => (
          <DropdownMenuItem key={item.label} onSelect={() => queue(item.onSelect)}>
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
        {pinned !== null && (
          <>
            {extraItems?.length ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onSelect={() => queueAction("pin")}>
              {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
              {pinned ? "Desfijar" : "Fijar"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => queueAction("rename")}>
              <Pencil aria-hidden />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => queueAction("delete")}>
              <Trash2 aria-hidden />
              Borrar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
