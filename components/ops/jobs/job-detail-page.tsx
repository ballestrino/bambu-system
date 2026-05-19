"use client";

import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  MapPin,
  UsersRound,
} from "lucide-react";

import { JobAssignmentsPanel } from "@/components/ops/jobs/job-assignments-panel";
import { JobAssignmentDialog } from "@/components/ops/jobs/job-assignment-dialog";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { JobLatestOccurrencePanel } from "@/components/ops/jobs/job-latest-occurrence-panel";
import { getPendingRegistrationVisits } from "@/components/ops/jobs/pending-visits-utils";
import { PendingVisitsPanel } from "@/components/ops/jobs/pending-visits-panel";
import { JobScheduleRulesPanel } from "@/components/ops/jobs/job-schedule-rules-panel";
import { JobScheduleRuleDialog } from "@/components/ops/jobs/job-schedule-rule-dialog";
import { JobSummaryCard } from "@/components/ops/jobs/job-summary-card";
import { JobStatusBadge } from "@/components/ops/jobs/status-badges";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { JobClientPaymentsPanel } from "@/components/ops/payments/job-client-payments-panel";
import { useJob } from "@/components/ops/hooks/useJob";
import { useJobEmployeeAssignmentMutations } from "@/components/ops/hooks/useJobEmployeeAssignmentMutations";
import { useJobEmployeeAssignments } from "@/components/ops/hooks/useJobEmployeeAssignments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobScheduleRuleMutations } from "@/components/ops/hooks/useJobScheduleRuleMutations";
import { useJobScheduleRules } from "@/components/ops/hooks/useJobScheduleRules";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { OpsDetailHero, OpsDetailStat, OpsNextAction, OpsPageShell } from "@/components/ops/shared";
import { Card, CardContent } from "@/components/ui/card";

export const JobDetailPage = ({ jobId }: { jobId: string }) => {
  const { job, isLoading, error } = useJob(jobId);
  const { jobs } = useJobs({ includeArchived: false });
  const { scheduleRules } = useJobScheduleRules({ jobId });
  const { occurrences } = useJobOccurrences({ jobId }, jobId);
  const { assignments } = useJobEmployeeAssignments({ jobId }, jobId);
  const { archiveScheduleRuleAsync } = useJobScheduleRuleMutations(jobId);
  const { archiveAssignmentAsync } = useJobEmployeeAssignmentMutations(jobId);

  if (isLoading) {
    return <div className="container w-full animate-pulse rounded-lg bg-muted/40 p-20" />;
  }

  if (error || !job) {
    return (
      <Card className="container w-full border-dashed">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No pudimos cargar el trabajo</h1>
        </CardContent>
      </Card>
    );
  }

  const activeAssignments = assignments.filter((assignment) => !assignment.archivedAt);
  const pendingOccurrences = occurrences.filter(
    (occurrence) => occurrence.status === "SCHEDULED"
  );
  const completedOccurrences = occurrences.filter((occurrence) => occurrence.status === "DONE");
  const pendingRegistrationOccurrences = getPendingRegistrationVisits(occurrences);
  const location = job.serviceLocation || job.serviceAddress || "Sin ubicacion cargada";

  return (
    <OpsPageShell>
      <OpsDetailHero
        actions={<JobFormDialog job={job} triggerLabel="Editar trabajo" />}
        backHref="/dashboard/jobs"
        backLabel="Trabajos"
        description="Centro operativo del servicio: equipo, agenda, snapshot del presupuesto y cobros."
        icon={BriefcaseBusiness}
        meta={<JobStatusBadge status={job.status} />}
        title={job.name}
      >
        <OpsDetailStat icon={UsersRound} label="Equipo activo" value={activeAssignments.length} helper="asignaciones vigentes" />
        <OpsDetailStat icon={CalendarClock} label="Agenda pendiente" value={pendingOccurrences.length} helper={`${scheduleRules.length} regla(s)`} />
        <OpsDetailStat icon={CalendarCheck2} label="Visitas hechas" value={completedOccurrences.length} helper="con estado realizado" />
        <OpsDetailStat icon={MapPin} label="Ubicacion" value={location === "Sin ubicacion cargada" ? "Pendiente" : "Cargada"} helper={location} />
      </OpsDetailHero>

      {!activeAssignments.length ? (
        <OpsNextAction
          action={<JobAssignmentDialog jobId={jobId} />}
          description="Primero dejá definido el equipo base para que el resto de la agenda tenga responsables claros."
          icon={UsersRound}
          title="Asignar equipo al trabajo"
        />
      ) : !scheduleRules.length && !occurrences.length ? (
        <OpsNextAction
          action={<JobScheduleRuleDialog jobId={jobId} />}
          description="Con el equipo listo, el siguiente paso natural es crear la recurrencia o cargar la primera visita manual."
          icon={CalendarClock}
          title="Planificar las visitas"
        />
      ) : pendingRegistrationOccurrences.length ? (
        <PendingVisitsPanel
          occurrences={pendingRegistrationOccurrences}
          scheduleRules={scheduleRules}
        />
      ) : (
        <OpsNextAction
          action={<PaymentDialog jobId={job.id} jobs={jobs} />}
          description="La operación ya tiene base operativa. Revisá saldo esperado y registrá el cobro cuando corresponda."
          icon={CircleDollarSign}
          title="Revisar cobros del trabajo"
          tone="money"
        />
      )}

      <JobSummaryCard job={job} />

      <div className="grid gap-6 xl:grid-cols-2">
        <JobLatestOccurrencePanel jobId={jobId} occurrences={occurrences} />
        <JobScheduleRulesPanel
          jobId={jobId}
          rules={scheduleRules}
          onArchive={async (scheduleRuleId) => {
            await archiveScheduleRuleAsync(scheduleRuleId);
          }}
        />
      </div>

      <JobAssignmentsPanel
        jobId={jobId}
        assignments={assignments}
        onArchive={async (assignmentId) => {
          await archiveAssignmentAsync(assignmentId);
        }}
      />
      <JobClientPaymentsPanel job={job} jobs={jobs} />
    </OpsPageShell>
  );
};
