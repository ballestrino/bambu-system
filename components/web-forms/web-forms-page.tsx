"use client";

import type { Chat } from "@ai-sdk/react";
import { useState } from "react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AgentFloatingPanel } from "@/components/agent/agent-floating-panel";
import type { AgentUIMessage } from "@/components/agent/types";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared/ops-page-shell";
import { OpsRefreshButton } from "@/components/ops/shared/ops-refresh-button";
import { OpsViewTabs } from "@/components/ops/shared/ops-view-tabs";
import { useOpsDebouncedValue } from "@/components/ops/shared/use-ops-debounced-value";
import { useWebFormReplyFills } from "@/components/web-forms/hooks/use-web-form-reply-fills";
import { useWebFormDetail, useWebFormList } from "@/components/web-forms/hooks/use-web-forms";
import { pushReplyFill, type ReplyFill } from "@/components/web-forms/reply-fill-store";
import { WebFormDetailPanel } from "@/components/web-forms/web-form-detail";
import { WebFormList } from "@/components/web-forms/web-form-list";
import { WebFormsBulkActions } from "@/components/web-forms/web-forms-bulk-actions";
import { WebFormsToolbar, type WebFormFilters, type WebFormKindTab } from "@/components/web-forms/web-forms-toolbar";
import { ALL_AGENT_CONVERSATIONS } from "@/lib/agent/conversation-scope";
import { cn } from "@/lib/utils";

// Sigue la conversación aunque el panel esté cerrado: lo que escribe
// fillWebFormReply va al campo Mensaje del formulario (reply-fill-store.ts).
function ReplyFillListener({ chat, onFill }: { chat: Chat<AgentUIMessage>; onFill: (fill: ReplyFill) => void }) {
  useWebFormReplyFills(chat, onFill);
  return null;
}

const KIND_TABS: { id: WebFormKindTab; label: string }[] = [
  { id: "CONTACT", label: "Pedidos de servicio" },
  { id: "JOB_APPLICATION", label: "Currículums" },
];

// Formularios de la web pública: dos pestañas (Pedidos de servicio y
// Currículums), la lista a la izquierda y el elegido (?id=) a la derecha,
// pegado arriba al bajar. En el teléfono, uno u otro. El agente es el de
// Panda (todas las tools y todo el historial) con el formulario como contexto:
// flota encima de la página, que no cambia al abrirlo.
export function WebFormsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const [filters, setFilters] = useState<WebFormFilters>({ status: "NEW", kind: "CONTACT", search: "" });
  const search = useOpsDebouncedValue(filters.search, 400);
  const list = useWebFormList({ status: filters.status, kind: filters.kind, search });
  const selected = useWebFormDetail(selectedId);

  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("id", id);
    else next.delete("id");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Un enlace (el aviso por correo) o "Es un currículum" pueden dejar elegido
  // uno de la otra pestaña: se muestra la suya.
  const selectedKind = selected.data?.kind;
  const [followedKind, setFollowedKind] = useState(selectedKind);
  if (selectedKind && selectedKind !== followedKind) {
    setFollowedKind(selectedKind);
    if (filters.kind !== selectedKind) setFilters({ ...filters, kind: selectedKind });
  }

  const changeKind = (kind: WebFormKindTab) => {
    if (kind === filters.kind) return;
    setFilters({ ...filters, kind });
    select(null);
  };

  const onReplyFill = (fill: ReplyFill) => {
    pushReplyFill(fill);
    if (fill.formId !== selectedId) toast.info(`La respuesta quedó para el formulario de ${fill.name}: abrilo para verla`);
  };

  const form = selected.data;
  const agentLabel = form ? `Formulario: ${form.name}` : "Formularios web";

  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Web"
        title="Formularios"
        description="Lo que llega desde bambu-servicios.com. Respondé desde acá: sale de contacto@ y queda en Enviados."
        actions={
          <div className="flex items-center gap-2">
            <OpsRefreshButton isRefreshing={list.isFetching} onRefresh={() => list.refetch()} />
            <AgentFloatingPanel
              scope={ALL_AGENT_CONVERSATIONS}
              resumeLatest={false}
              contextLabel={agentLabel}
              freshKey={selectedId}
              getContext={() => (selectedId ? { kind: "web-form", submissionId: selectedId } : undefined)}
              renderListener={(chat) => <ReplyFillListener key={chat.id} chat={chat} onFill={onReplyFill} />}
            />
          </div>
        }
      />

      <OpsViewTabs
        label="Tipo de formulario"
        value={filters.kind}
        onValueChange={changeKind}
        views={KIND_TABS.map((tab) => ({ ...tab, count: list.data?.newByKind[tab.id] }))}
      >
        {null}
      </OpsViewTabs>

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:items-start">
        <section
          className={cn("min-w-0 space-y-3", selectedId && "hidden lg:block")}
          aria-label="Formularios recibidos"
        >
          <WebFormsToolbar
            filters={filters}
            counts={list.data?.counts}
            isSearching={list.isFetching && search !== ""}
            onChange={setFilters}
          />
          <WebFormsBulkActions kind={filters.kind} />
          <WebFormList query={list} selectedId={selectedId} onSelect={select} filters={filters} />
        </section>

        <section
          className={cn(
            "min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto",
            !selectedId && "hidden lg:block"
          )}
          aria-label="Formulario elegido"
        >
          <WebFormDetailPanel id={selectedId} onClose={() => select(null)} />
        </section>
      </div>
    </OpsPageShell>
  );
}
