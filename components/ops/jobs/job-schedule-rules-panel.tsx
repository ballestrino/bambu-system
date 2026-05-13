"use client";

import { CalendarRange, Clock3 } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { OpsDetailRow, OpsSection, opsFrequencyLabels } from "@/components/ops/shared";
import DeleteDialog from "@/components/ui/delete-dialog";
import { JobScheduleRuleDialog } from "@/components/ops/jobs/job-schedule-rule-dialog";
import { formatDate } from "@/components/ops/utils";
import type { OpsScheduleRule } from "@/components/ops/types";

const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const toClockLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const describeRule = (rule: OpsScheduleRule) => {
  if (rule.frequency === "WEEKLY") {
    return rule.weekdays.map((day) => weekdayLabels[day - 1]).join(", ");
  }

  if (rule.frequency === "MONTHLY") {
    return `Dia ${rule.dayOfMonth}`;
  }

  return `Cada ${rule.interval} dia(s)`;
};

export const JobScheduleRulesPanel = ({
  jobId,
  rules,
  onArchive,
}: {
  jobId: string;
  rules: OpsScheduleRule[];
  onArchive: (scheduleRuleId: string) => Promise<void>;
}) => (
  <OpsSection
    actions={<JobScheduleRuleDialog jobId={jobId} />}
    description="Recurrencias base para poblar la agenda del trabajo."
    title="Reglas de calendario"
  >
    <div className="space-y-3">
      {rules.length ? (
        rules.map((rule) => (
          <OpsDetailRow
            key={rule.id}
            actions={
              <>
                <JobScheduleRuleDialog jobId={jobId} rule={rule} />
                <DeleteDialog
                  title="Archivar regla"
                  description="La regla dejará de estar activa para el trabajo."
                  deleteButtonText="Archivar"
                  deleteButtonVariant="default"
                  onConfirm={async () => {
                    await onArchive(rule.id);
                  }}
                  trigger={<button className={dashboardSecondaryActionClass} type="button">Archivar</button>}
                />
              </>
            }
          >
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EAF5EC] px-3 py-1 text-xs font-medium text-[#244C2D] ring-1 ring-[#53985E]/15">
                  {opsFrequencyLabels[rule.frequency]}
                </span>
                <span className="rounded-full border border-[#53985E]/12 bg-white px-3 py-1 text-xs text-muted-foreground dark:bg-background/40">
                  {describeRule(rule)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <CalendarRange className="h-4 w-4 text-[#53985E]" />
                <span>
                  Desde {formatDate(rule.startDate)} hasta {formatDate(rule.endDate)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4 text-[#53985E]" />
                <span>
                  {toClockLabel(rule.startTimeMinutes)} · duracion {rule.durationMinutes} min
                </span>
              </div>
            </div>
          </OpsDetailRow>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay reglas para este trabajo.</p>
      )}
    </div>
  </OpsSection>
);
