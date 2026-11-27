import { useEffect } from "react";

// Lo que fillWebFormReply escribió para un formulario (feature 75), camino al
// composer. Si el composer de ese formulario no está a la vista (otro elegido,
// o el editor cargando), queda esperando y se aplica cuando aparece.
export type ReplyFill = { formId: string; name: string; subject: string | null; body: string };

let pending: ReplyFill | null = null;
const listeners = new Set<(fill: ReplyFill) => void>();

export const pushReplyFill = (fill: ReplyFill) => {
  pending = fill;
  listeners.forEach((listener) => listener(fill));
};

// apply es null mientras no hay editor: el pedido queda para después.
export const useReplyFill = (formId: string, apply: ((fill: ReplyFill) => void) | null) => {
  useEffect(() => {
    if (!apply) return;
    const handle = (fill: ReplyFill) => {
      if (fill.formId !== formId) return;
      pending = null;
      apply(fill);
    };
    if (pending) handle(pending);
    listeners.add(handle);
    return () => {
      listeners.delete(handle);
    };
  }, [formId, apply]);
};
