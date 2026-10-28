"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { OPS_MONTH_BAR_START_ID } from "@/components/ops/shared/ops-month-provider";

const noopSubscribe = () => () => {};

// Volver atrás sin texto, arriba a la izquierda en la barra del mes global. Si
// la página se abrió directo (sin historial), va a `fallbackHref`.
export const OpsBackButton = ({ fallbackHref }: { fallbackHref: string }) => {
  const router = useRouter();
  // El lugar lo dibuja el proveedor del mes; en el servidor no hay DOM.
  const slot = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById(OPS_MONTH_BAR_START_ID),
    () => null
  );

  const button = (
    <button
      aria-label="Volver atrás"
      className="flex size-[46px] flex-none items-center justify-center rounded-[var(--ops-radius-row)] border border-ops-border bg-ops-surface text-ops-text transition-colors hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none print:hidden"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref))}
      title="Volver atrás"
      type="button"
    >
      <ArrowLeft className="size-4" />
    </button>
  );

  return slot ? createPortal(button, slot) : null;
};
