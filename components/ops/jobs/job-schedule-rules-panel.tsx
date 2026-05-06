"use client";

import DeleteDialog from "@/components/ui/delete-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobScheduleRuleDialog } from "@/components/ops/jobs/job-schedule-rule-dialog";
import { formatDate } from "@/components/ops/utils";
import type { OpsScheduleRule } from "@/components/ops/types";

const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

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
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Reglas de calendario</CardTitle>
      <JobScheduleRuleDialog jobId={jobId} />
    </CardHeader>
    <CardContent className="space-y-3">
      {rules.length ? (
        rules.map((rule) => (
          <div key={rule.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 text-sm">
                <p className="font-medium">{rule.frequency} · {describeRule(rule)}</p>
                <p className="text-muted-foreground">Desde {formatDate(rule.startDate)} hasta {formatDate(rule.endDate)}</p>
                <p className="text-muted-foreground">{rule.startTimeMinutes} min desde medianoche · duración {rule.durationMinutes} min</p>
              </div>
              <div className="flex gap-2">
                <JobScheduleRuleDialog jobId={jobId} rule={rule} />
                <DeleteDialog
                  title="Archivar regla"
                  description="La regla dejará de estar activa para el trabajo."
                  deleteButtonText="Archivar"
                  deleteButtonVariant="default"
                  onConfirm={async () => {
                    await onArchive(rule.id);
                  }}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay reglas para este trabajo.</p>
      )}
    </CardContent>
  </Card>
);
