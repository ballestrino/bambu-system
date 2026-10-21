import { formatHours } from "@/components/ops/employees/employee-payroll";
import type { OpsOccurrence } from "@/components/ops/types";
import {
  formatPaidNotice,
  formatVisitPayrollWarning,
  getVisitPayrollImpact,
  joinEmployeeNames,
  type VisitPayrollImpact,
} from "@/components/ops/visit-payroll-impact";
import type { VisitState } from "@/lib/agent/visit-format";
import { formatVisitRange } from "@/lib/agent/visit-time";

// Avisos de la tarjeta de una propuesta de visitas. Puro: las lecturas
// (cruces y pagos ya cargados) las hace la tool.
const MAX_WARNINGS = 3;

// getVisitPayrollImpact lee solo el estado, los horarios y el id y nombre de
// cada empleada: el resto de la visita no hace falta.
export const visitPayrollImpact = (state: VisitState): VisitPayrollImpact | null =>
  getVisitPayrollImpact({
    ...state,
    employees: state.employees.map((employee) => ({ employee })),
  } as unknown as OpsOccurrence);

export type VisitOverlap = { job: string; start: Date; end: Date; employees: string[] };

export const capWarnings = (warnings: string[]) =>
  warnings.length > MAX_WARNINGS
    ? [...warnings.slice(0, MAX_WARNINGS), `Y ${warnings.length - MAX_WARNINGS} avisos más.`]
    : warnings;

const sameImpact = (left: VisitPayrollImpact, right: VisitPayrollImpact) =>
  left.hours === right.hours &&
  left.paymentMonthKey === right.paymentMonthKey &&
  left.employees.map((employee) => employee.id).sort().join() ===
    right.employees.map((employee) => employee.id).sort().join();

// Lo que cambia en sueldos: una visita realizada suma sus horas reales y un
// transporte a cada empleada del mes en que estaba programada.
export const payrollChangeWarnings = (
  before: VisitState,
  after: VisitState,
  paid: { before: string[]; after: string[] }
) => {
  const from = visitPayrollImpact(before);
  const to = visitPayrollImpact(after);
  const hours = (impact: VisitPayrollImpact) =>
    impact.hours > 0 ? `${formatHours(impact.hours)} hs y el transporte` : "el transporte";
  let change: string | null = null;
  if (!from && to) {
    change = `Pasa a contar para los sueldos de ${to.workMonthName}: suma ${hours(to)} a ${joinEmployeeNames(to.employees)}.`;
  } else if (from && !to) {
    change = `Sale de los sueldos de ${from.workMonthName}: se resta ${hours(from)} a ${joinEmployeeNames(from.employees)}.`;
  } else if (from && to && !sameImpact(from, to)) {
    change = `Cambia los sueldos de ${to.workMonthName}: de ${formatHours(from.hours)} a ${formatHours(to.hours)} hs para ${joinEmployeeNames(to.employees)}.`;
  }
  if (!change) return [];
  const notices = [from && formatPaidNotice(from, paid.before), to && formatPaidNotice(to, paid.after)];
  return [change, ...new Set(notices.filter((notice): notice is string => Boolean(notice)))];
};

export const overlapWarnings = (overlaps: VisitOverlap[]) =>
  overlaps.map(
    (overlap) =>
      `Se cruza con ${overlap.job} (${formatVisitRange(overlap.start, overlap.end)}) de ${overlap.employees.join(", ")}.`
  );

export const buildUpdateVisitWarnings = ({
  before,
  after,
  notices,
  overlaps,
  paid,
  now,
}: {
  before: VisitState;
  after: VisitState;
  notices: string[];
  overlaps: VisitOverlap[];
  paid: { before: string[]; after: string[] };
  now: Date;
}) => {
  const moved = before.scheduledStartAt.getTime() !== after.scheduledStartAt.getTime();
  const past =
    moved && after.status === "SCHEDULED" && after.scheduledStartAt.getTime() < now.getTime()
      ? ["El horario nuevo ya pasó y la visita queda programada."]
      : [];
  return capWarnings([...payrollChangeWarnings(before, after, paid), ...notices, ...overlapWarnings(overlaps), ...past]);
};

// Eliminar una realizada le resta sus horas a la nómina: el mismo aviso que
// muestra "Eliminar visita" en la pantalla.
export const buildArchiveVisitWarnings = (before: VisitState, paidEmployeeIds: string[]) => {
  const impact = visitPayrollImpact(before);
  return impact ? formatVisitPayrollWarning(impact, paidEmployeeIds) : [];
};
