"use client";

import { useRef, useState } from "react";

// One dialog at a time per table row, mounted only while open. Radix hands
// focus back to a dialog's trigger on close, and these dialogs have none (the
// row's own buttons open them), so the button that opened it gets focus back.
export const useRowDialog = <Kind extends string>() => {
  const [dialog, setDialog] = useState<Kind | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const openDialog = (kind: Kind, opener: HTMLElement) => {
    openerRef.current = opener;
    setDialog(kind);
  };

  const onOpenChange = (open: boolean) => {
    if (open) return;
    setDialog(null);
    const opener = openerRef.current;
    // Deferred until the dialog has unmounted and released focus.
    window.setTimeout(() => opener?.focus(), 0);
  };

  return { dialog, onOpenChange, openDialog };
};
