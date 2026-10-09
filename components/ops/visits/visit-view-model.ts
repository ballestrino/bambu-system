import { Clock3, Pencil, UserPlus, type LucideIcon } from "lucide-react";

import {
  formatActualRange,
  getVisitAddress,
  getVisitEmployees,
  isAttentionVisit,
  isRegistrableVisit,
} from "@/lib/ops/visit-day";
import type { OpsOccurrence } from "@/components/ops/types";

export type VisitActionKind = "asignar" | "editar" | "registrar";

export type VisitAction = {
  icon: LucideIcon;
  kind: VisitActionKind;
  label: string;
  short: string;
};

const ACTIONS: Record<VisitActionKind, VisitAction> = {
  asignar: { icon: UserPlus, kind: "asignar", label: "Asignar", short: "Asignar" },
  editar: { icon: Pencil, kind: "editar", label: "Editar", short: "Editar" },
  registrar: { icon: Clock3, kind: "registrar", label: "Registrar horario", short: "Registrar" },
};

// La accion que la visita pide primero: sin equipo se asigna, con equipo y
// sin horario real se registra, el resto se edita.
export const getVisitAction = (visit: OpsOccurrence): VisitAction => {
  if (!getVisitEmployees(visit).length) return ACTIONS.asignar;
  if (isRegistrableVisit(visit)) return ACTIONS.registrar;
  return ACTIONS.editar;
};

export const getVisitTeamLabel = (visit: OpsOccurrence, exceptId?: string) => {
  const team = getVisitEmployees(visit).filter((employee) => employee.id !== exceptId);
  if (!team.length) return exceptId ? null : "Sin asignar";
  return team.map((employee) => employee.name).join(" y ");
};

// "con Lucía": las compañeras de una visita compartida, por nombre de pila.
export const getVisitPartners = (visit: OpsOccurrence, employeeId: string) => {
  const others = getVisitEmployees(visit).filter((employee) => employee.id !== employeeId);
  return others.length ? `con ${others.map((employee) => employee.name.split(" ")[0]).join(", ")}` : null;
};

// Segunda linea de una visita: lo que importa de su estado o, si no, donde es.
export const getVisitSubline = (visit: OpsOccurrence) => {
  const actual = formatActualRange(visit);
  if (visit.status === "SKIPPED") return visit.notes ? `Omitida · ${visit.notes}` : "Omitida";
  if (visit.status === "CANCELED") return visit.notes ? `Cancelada · ${visit.notes}` : "Cancelada";
  if (actual) return `Real ${actual}`;
  return getVisitAddress(visit) ?? "Sin dirección registrada";
};

export const getVisitRuleLabel = (visit: OpsOccurrence) => {
  if (visit.scheduleRuleId) return "Ligada a regla semanal";
  return visit.isDetached ? "Separada de la regla" : "Visita suelta";
};

export const getAttentionReason = (visit: OpsOccurrence) => {
  if (!getVisitEmployees(visit).length) return "Sin asignar";
  if (!isAttentionVisit(visit)) return null;
  const status = visit.status === "SKIPPED" ? "Omitida" : "Cancelada";
  return visit.notes ? `${status} · ${visit.notes}` : status;
};
