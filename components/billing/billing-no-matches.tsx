"use client";

import { X } from "lucide-react";

// Una vista sin nada que coincida con los filtros (48).
export const BillingNoMatches = ({ onClear }: { onClear: () => void }) => (
  <section className="flex flex-col items-center gap-3 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface px-6 py-10 text-center text-sm text-ops-text-muted">
    Ninguna factura coincide con los filtros.
    <button
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ops-border px-3.5 text-[13px] font-semibold text-ops-text hover:bg-ops-surface-muted"
      onClick={onClear}
      type="button"
    >
      <X aria-hidden className="size-3.5" />
      Limpiar filtros
    </button>
  </section>
);
