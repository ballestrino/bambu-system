"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared/ops-page-shell";
import { OpsRefreshButton } from "@/components/ops/shared/ops-refresh-button";
import { useOpsDebouncedValue } from "@/components/ops/shared/use-ops-debounced-value";
import { useWebFormList } from "@/components/web-forms/hooks/use-web-forms";
import { WebFormDetailPanel } from "@/components/web-forms/web-form-detail";
import { WebFormList } from "@/components/web-forms/web-form-list";
import { WebFormsToolbar, type WebFormFilters } from "@/components/web-forms/web-forms-toolbar";
import { cn } from "@/lib/utils";

// Formularios de la web pública: lista a la izquierda y el elegido a la
// derecha (?id=). En el teléfono, uno u otro.
export function WebFormsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const [filters, setFilters] = useState<WebFormFilters>({ status: "NEW", kind: "ALL", search: "" });
  const search = useOpsDebouncedValue(filters.search, 400);
  const list = useWebFormList({ status: filters.status, kind: filters.kind, search });

  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("id", id);
    else next.delete("id");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Web"
        title="Formularios"
        description="Lo que llega desde bambu-servicios.com. Respondé desde acá: sale de contacto@ y queda en Enviados."
        actions={<OpsRefreshButton isRefreshing={list.isFetching} onRefresh={() => list.refetch()} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:items-start">
        <section className={cn("min-w-0 space-y-3", selectedId && "hidden lg:block")} aria-label="Formularios recibidos">
          <WebFormsToolbar
            filters={filters}
            counts={list.data?.counts}
            isSearching={list.isFetching && search !== ""}
            onChange={setFilters}
          />
          <WebFormList query={list} selectedId={selectedId} onSelect={select} filters={filters} />
        </section>

        <section className={cn("min-w-0", !selectedId && "hidden lg:block")} aria-label="Formulario elegido">
          <WebFormDetailPanel id={selectedId} onClose={() => select(null)} />
        </section>
      </div>
    </OpsPageShell>
  );
}
