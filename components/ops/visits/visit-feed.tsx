"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, History, LoaderCircle } from "lucide-react";

import { OpsEmptyState } from "@/components/ops/shared";
import type { VisitWeekPage } from "@/components/ops/types";
import { formatDate } from "@/components/ops/utils";
import { VisitCard } from "@/components/ops/visits/visit-card";
import { VisitListRow } from "@/components/ops/visits/visit-list-row";
import type { VisitView } from "@/components/ops/visits/visit-view-switcher";
import { Button } from "@/components/ui/button";

const WeekGroup = ({
  page,
  view,
}: {
  page: VisitWeekPage;
  view: Exclude<VisitView, "calendar">;
}) => {
  if (!page.occurrences.length) return null;
  const startLabel = formatDate(page.weekStart);
  const endLabel = formatDate(page.weekEnd);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#53985E]/15" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`}
        </h2>
        <div className="h-px flex-1 bg-[#53985E]/15" />
      </div>
      <div className={view === "cards" ? "grid gap-4 xl:grid-cols-2" : "space-y-2"}>
        {page.occurrences.map((occurrence) =>
          view === "cards" ? (
            <VisitCard key={occurrence.id} occurrence={occurrence} />
          ) : (
            <VisitListRow key={occurrence.id} occurrence={occurrence} />
          )
        )}
      </div>
    </section>
  );
};

export const VisitFeed = ({
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  pages,
  refetch,
  view,
}: {
  error: Error | null;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  pages: VisitWeekPage[];
  refetch: () => Promise<unknown>;
  view: Exclude<VisitView, "calendar">;
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasVisits = pages.some((page) => page.occurrences.length > 0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: view === "cards" ? 4 : 6 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-lg bg-muted/40" key={index} />
        ))}
      </div>
    );
  }

  if (error && !hasVisits) {
    return (
      <OpsEmptyState
        action={<Button onClick={() => void refetch()}>Reintentar</Button>}
        description="Revisa la conexión y vuelve a cargar el historial."
        icon={AlertCircle}
        title="No pudimos cargar las visitas"
      />
    );
  }

  return (
    <div className="space-y-6">
      {pages.map((page) => (
        <WeekGroup key={page.weekStart} page={page} view={view} />
      ))}

      {!hasVisits && !hasNextPage ? (
        <OpsEmptyState
          description="Cambia el mes o limpia los filtros para revisar otro tramo del historial."
          icon={History}
          title="No hay visitas para esta selección"
        />
      ) : null}

      {error && hasVisits ? (
        <div className="flex items-center justify-center gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
          No pudimos cargar otra semana.
          <Button onClick={() => void fetchNextPage()} size="sm" variant="outline">
            Reintentar
          </Button>
        </div>
      ) : null}

      {hasNextPage ? (
        <div className="flex justify-center py-2" ref={sentinelRef}>
          <Button
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            type="button"
            variant="ghost"
          >
            {isFetchingNextPage ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {isFetchingNextPage ? "Cargando semana anterior..." : "Cargar semana anterior"}
          </Button>
        </div>
      ) : hasVisits ? (
        <p className="py-3 text-center text-sm text-muted-foreground">
          Llegaste al inicio del historial disponible.
        </p>
      ) : null}
    </div>
  );
};
