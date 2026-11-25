"use client";

import { useId, useState } from "react";

import { DashboardPendingAlert } from "@/components/ops/dashboard/dashboard-pending-alert";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import type { PendingVisitsData } from "@/components/ops/hooks/usePendingVisits";
import { PendingVisitsView } from "@/components/ops/visits/pending/pending-visits-view";

export const JobPendingVisits = ({ jobId, pending }: { jobId: string; pending: PendingVisitsData }) => {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const expanded = open && pending.summary.total > 0;
  const { employees } = useEmployees({ isActive: true }, expanded);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DashboardPendingAlert
        pending={pending}
        review={{ controls: panelId, expanded, onToggle: () => setOpen((current) => !current) }}
      />
      <div hidden={!expanded} id={panelId}>
        {expanded ? <PendingVisitsView employees={employees} jobId={jobId} pending={pending} /> : null}
      </div>
    </div>
  );
};
