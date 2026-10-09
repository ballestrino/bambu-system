"use client";

import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";

// Crear y editar siguen en el dialogo completo de siempre.
export const VisitDialogs = ({ ctrl }: { ctrl: VisitsController }) => (
  <>
    {ctrl.creating ? (
      <JobOccurrenceDialog
        defaults={ctrl.creating}
        intent="schedule"
        key="create"
        onOpenChange={(open) => {
          if (!open) ctrl.setCreating(null);
        }}
        open
      />
    ) : null}
    {ctrl.editing ? (
      <JobOccurrenceDialog
        intent="schedule"
        key={ctrl.editing.id}
        occurrence={ctrl.editing}
        onOpenChange={(open) => {
          if (!open) ctrl.setEditing(null);
        }}
        open
      />
    ) : null}
  </>
);
