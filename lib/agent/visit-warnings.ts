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

const visitsCount = (count: number) => (count === 1 ? "1 visita" : `${count} visitas`);
const uniqueJoin = (values: string[]) => [...new Set(values)].join(" y ");
const namesOf = (impacts: VisitPayrollImpact[]) =>
  joinEmployeeNames([...new Map(impacts.flatMap((impact) => impact.employees).map((employee) => [employee.id, employee])).values()]);
const hoursOf = (impacts: VisitPayrollImpact[]) => formatHours(impacts.reduce((total, impact) => total + impact.hours, 0));

// Lo que cambia en sueldos un lote, en una línea por tipo de cambio y no una
// por visita. paid: las empleadas con pagos cargados, por paymentMonthKey.
export const batchPayrollWarnings = (pairs: { before: VisitState; after: VisitState }[], paid: Map<string, string[]>) => {
  const impacts = pairs.map(({ before, after }) => ({ from: visitPayrollImpact(before), to: visitPayrollImpact(after) }));
  const entering = impacts.flatMap(({ from, to }) => (!from && to ? [to] : []));
  const leaving = impacts.flatMap(({ from, to }) => (from && !to ? [from] : []));
  const changed = impacts.filter(({ from, to }) => from && to && !sameImpact(from, to)).length;
  const lines = [
    entering.length
      ? `${visitsCount(entering.length)} pasa${entering.length > 1 ? "n" : ""} a contar para los sueldos de ${uniqueJoin(entering.map((impact) => impact.workMonthName))}: suma${entering.length > 1 ? "n" : ""} ${hoursOf(entering)} hs y el transporte de cada una a ${namesOf(entering)}.`
      : null,
    leaving.length
      ? `${visitsCount(leaving.length)} sale${leaving.length > 1 ? "n" : ""} de los sueldos de ${uniqueJoin(leaving.map((impact) => impact.workMonthName))}: se restan ${hoursOf(leaving)} hs y el transporte de cada una a ${namesOf(leaving)}.`
      : null,
    changed ? `${visitsCount(changed)} cambia${changed > 1 ? "n" : ""} sus horas en los sueldos.` : null,
    ...impacts
      .flatMap(({ from, to }) => [from, to])
      .map((impact) => impact && formatPaidNotice(impact, paid.get(impact.paymentMonthKey) ?? [])),
  ];
  return [...new Set(lines.filter((line): line is string => Boolean(line)))];
};

export const overlapWarnings =(overlaps: VisitOverlap[]) =>
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
