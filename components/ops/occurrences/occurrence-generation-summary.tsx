"use client";

import { Info, Loader2, TriangleAlert } from "lucide-react";

import type { ReplaceableOccurrencePreview } from "@/components/ops/occurrences/occurrence-replacement-list";
import { formatDate } from "@/components/ops/utils";
import { parseWeekDateKey } from "@/lib/ops/schedule-week";
import { DEFAULT_OPS_TIMEZONE, zonedTimeToUtc } from "@/lib/ops/timezone";

export type OccurrenceGenerationPreview = {
  cappedAtHorizon: boolean;
  horizonKey: string;
  jobs: number;
  kept: number;
  replaceable: ReplaceableOccurrencePreview[];
  startsInPast: boolean;
  visits: number;
};

// Anchored at local noon so the day never slides when it is formatted.
export const formatDateKey = (key: string) => {
  const date = parseWeekDateKey(key);
  return date ? formatDate(zonedTimeToUtc({ ...date, hour: 12 }, DEFAULT_OPS_TIMEZONE)) : key;
};

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

const Note = ({ children, tone }: { children: React.ReactNode; tone: "info" | "warn" }) => (
  <p
    className={
      tone === "warn"
        ? "flex gap-2 text-sm text-amber-700 dark:text-amber-300"
        : "flex gap-2 text-sm text-muted-foreground"
    }
  >
    {tone === "warn" ? (
      <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
    ) : (
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
    )}
    <span>{children}</span>
  </p>
);

export const OccurrenceGenerationSummary = ({
  error,
  isLoading,
  preview,
  rangeError,
}: {
  error: Error | null;
  isLoading: boolean;
  preview?: OccurrenceGenerationPreview;
  rangeError: string | null;
}) => {
  if (rangeError) {
    return <p className="text-sm text-destructive">{rangeError}</p>;
  }
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        Calculando las visitas que faltan...
      </p>
    );
  }
  if (error) {
    return <p className="text-sm text-destructive">{error.message}</p>;
  }
  if (!preview) return null;

  return (
    <div aria-live="polite" className="space-y-2">
      {preview.visits ? (
        <p className="text-sm">
          Se van a crear <strong>{plural(preview.visits, "visita", "visitas")}</strong> de{" "}
          <strong>{plural(preview.jobs, "trabajo", "trabajos")}</strong>.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {preview.replaceable.length
            ? "No faltan visitas por crear en ese rango."
            : "No hay visitas para generar en ese rango: ya están generadas o no hay reglas activas."}
        </p>
      )}
      {preview.startsInPast ? (
        <Note tone="warn">
          El rango empieza antes de hoy: esas visitas quedan programadas para que las registres.
        </Note>
      ) : null}
      {preview.cappedAtHorizon ? (
        <Note tone="info">
          Se genera hasta el {formatDateKey(preview.horizonKey)}: el límite es de 3 meses desde hoy.
        </Note>
      ) : null}
    </div>
  );
};
