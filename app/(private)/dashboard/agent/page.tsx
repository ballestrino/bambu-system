import { Suspense } from "react";

import { agentPageFullScreen } from "@/components/agent/agent-page-full-screen";
import { AgentPageHost } from "@/components/agent/agent-page-host";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function AgentPageFallback() {
  return (
    <div
      className={cn("flex w-full max-w-7xl flex-col", agentPageFullScreen)}
      aria-busy="true"
      aria-label="Cargando el agente"
    >
      <Skeleton className="h-[calc(100dvh-9.5rem-var(--bottom-tabs-space))] min-h-[32rem] w-full rounded-xl md:h-[calc(100dvh-9rem)] app-tabs:h-full app-tabs:min-h-0 app-tabs:rounded-none" />
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
