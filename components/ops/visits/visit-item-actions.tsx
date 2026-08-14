import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import {
  getVisitActionLabel,
  shouldCompleteOccurrenceOnSave,
} from "@/components/ops/calendar/calendar-utils";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import type { OpsOccurrence } from "@/components/ops/types";
import { Button } from "@/components/ui/button";

export const VisitItemActions = ({
  occurrence,
}: {
  occurrence: OpsOccurrence;
}) => (
  <div className="flex flex-wrap gap-2">
    <Button
      asChild
      className={dashboardSecondaryActionClass}
      size="sm"
      variant="outline"
    >
      <Link href={`/dashboard/jobs/${occurrence.jobId}`}>
        <BriefcaseBusiness className="h-4 w-4" />
        Trabajo
      </Link>
    </Button>
    <JobOccurrenceDialog
      completeOnSave={shouldCompleteOccurrenceOnSave(occurrence)}
      occurrence={occurrence}
      triggerLabel={getVisitActionLabel(occurrence)}
    />
  </div>
);
