"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/ops/jobs/status-badges";
import { formatDate, formatDateTime } from "@/components/ops/utils";
import type { OpsJobDetail } from "@/components/ops/types";

const readSnapshot = (snapshot: OpsJobDetail["budgetSnapshot"]) => {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  return snapshot as Record<string, unknown>;
};

export const JobSummaryCard = ({ job }: { job: OpsJobDetail }) => {
  const snapshot = readSnapshot(job.budgetSnapshot);
  const snapshotOption =
    snapshot?.option && typeof snapshot.option === "object" && !Array.isArray(snapshot.option)
      ? (snapshot.option as Record<string, unknown>)
      : null;

  return (
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl">{job.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {job.serviceLocation || job.serviceAddress || "Sin ubicación de referencia"}
          </p>
        </div>
        <JobStatusBadge status={job.status} />
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <p><strong>Descripción:</strong> {job.description || "-"}</p>
          <p><strong>Notas:</strong> {job.operationalNotes || "-"}</p>
          <p><strong>Creado:</strong> {formatDateTime(job.createdAt)}</p>
          <p><strong>Actualizado:</strong> {formatDateTime(job.updatedAt)}</p>
          <p><strong>Archivado:</strong> {formatDate(job.archivedAt)}</p>
        </div>
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4 text-sm">
          <p><strong>Presupuesto base:</strong> {job.sourceBudget?.name || "Sin vínculo"}</p>
          <p><strong>Slug fuente:</strong> {job.sourceBudget?.slug || "-"}</p>
          <p>
            <strong>Snapshot:</strong>{" "}
            {typeof snapshot?.capturedAt === "string"
              ? formatDateTime(snapshot.capturedAt)
              : "Sin snapshot"}
          </p>
          <p>
            <strong>Precio/visitas:</strong>{" "}
            {snapshotOption
              ? `$${snapshotOption.price ?? "-"} · ${snapshotOption.visits ?? "-"} visitas`
              : "Sin opción"}
          </p>
          <p>
            <strong>Horas y equipo:</strong>{" "}
            {snapshotOption
              ? `${snapshotOption.hoursPerVisit ?? "-"} hs/visita · ${snapshotOption.employees ?? "-"} persona(s)`
              : "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
