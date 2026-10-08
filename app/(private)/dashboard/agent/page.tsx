import { Suspense } from "react";

import { AgentPageHost } from "@/components/agent/agent-page-host";
import { Skeleton } from "@/components/ui/skeleton";

function AgentPageFallback() {
  return (
    <div className="flex w-full max-w-7xl flex-col gap-3" aria-busy="true" aria-label="Cargando el agente">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-[calc(100dvh-13rem-var(--bottom-tabs-space))] min-h-[28rem] w-full rounded-xl" />
    </div>
  );
}

// El agente de Bambú a pantalla completa, con todas las conversaciones. El
// host lee ?conversacion= con useSearchParams, que pide un Suspense arriba.
export default function AgentPage() {
  return (
    <Suspense fallback={<AgentPageFallback />}>
      <AgentPageHost />
    </Suspense>
  );
}
