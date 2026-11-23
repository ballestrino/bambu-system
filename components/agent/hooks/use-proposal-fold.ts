"use client";

import { useState } from "react";

import { useAgentFlag } from "@/components/agent/agent-browser-flags";

type Phase = "active" | "resolved";

// Si una tarjeta de propuesta se ve desplegada. Una pendiente (o guardándose)
// arranca como dice "Plegar las propuestas"; una resuelta, plegada en su
// recibo. La flecha manda sobre eso en cada tarjeta, hasta que la propuesta
// se resuelve: ahí vuelve al recibo, como en el diseño.
export const useProposalFold = (active: boolean) => {
  const foldPending = useAgentFlag("foldProposals");
  const phase: Phase = active ? "active" : "resolved";
  const [override, setOverride] = useState<{ phase: Phase; open: boolean } | null>(null);
  const open = override?.phase === phase ? override.open : active ? !foldPending : false;
  return {
    open,
    toggle: () => setOverride({ phase, open: !open }),
    unfold: () => setOverride({ phase, open: true }),
  };
};
