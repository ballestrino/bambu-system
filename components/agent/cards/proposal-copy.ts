import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

import { formatChangeValue, formatMoney } from "@/components/agent/format";
import type { ProposalDisplayStatus } from "@/lib/agent/proposal-outcome";
import type { AgentProposalKind, ProposalResult, ProposalSummary } from "@/lib/agent/proposals";

// Lo que dicen las tarjetas de propuesta (feature 69): qué va a pasar arriba y
// en el botón, la cifra clave de la línea plegada y el recibo de una ya
// resuelta. Puro, con prueba en check:agent-proposals.

const plural = (count: number, one: string, many: string) => (count === 1 ? `1 ${one}` : `${count} ${many}`);
const visits = (count: number) => plural(count, "visita", "visitas");

// Arriba del nombre. Memoria e instrucciones ya traen el suyo en el título.
const EYEBROWS: Record<AgentProposalKind, string> = {
  CREATE_BUDGET: "Crear presupuesto",
  UPDATE_BUDGET: "Cambiar presupuesto",
  DUPLICATE_BUDGET: "Duplicar presupuesto",
  PUBLISH_OFFICIAL_BUDGET: "Publicar precio oficial",
  CREATE_VISITS: "Agendar visitas",
  UPDATE_VISIT: "Cambiar visita",
  UPDATE_VISITS: "Cambiar visitas",
  ARCHIVE_VISIT: "Sacar de la agenda",
  SAVE_MEMORY: "Recordar",
  CHANGE_INSTRUCTIONS: "Cambiar instrucciones",
};

export const proposalEyebrow = (kind: AgentProposalKind, summary: Pick<ProposalSummary, "title">) =>
  kind === "SAVE_MEMORY" || kind === "CHANGE_INSTRUCTIONS"
    ? summary.title.replace(/ \((.+)\)$/, " · $1")
    : EYEBROWS[kind];

// El botón dice lo que hace. count: las visitas marcadas de un lote.
export const confirmLabel = (kind: AgentProposalKind, count: number | null) => {
  switch (kind) {
    case "CREATE_VISITS":
      return count === null ? "Agendar" : count === 0 ? "Agendar" : `Agendar ${visits(count)}`;
    case "UPDATE_VISITS":
      return count === null || count === 0 ? "Cambiar" : `Cambiar ${visits(count)}`;
    case "UPDATE_BUDGET":
      return "Guardar cambios";
    case "DUPLICATE_BUDGET":
      return "Duplicar";
    case "PUBLISH_OFFICIAL_BUDGET":
      return "Publicar";
    case "UPDATE_VISIT":
      return "Guardar cambio";
    case "ARCHIVE_VISIT":
      return "Sacar de la agenda";
    case "CHANGE_INSTRUCTIONS":
      return "Guardar instrucciones";
    default:
      return EYEBROWS[kind];
  }
};

// Lo que se ve de una propuesta plegada al lado del nombre.
export const proposalFigure = (kind: AgentProposalKind, summary: ProposalSummary, checked: number | null) => {
  const items = summary.items?.length ?? 0;
  if (items > 1) return checked === null || checked === items ? visits(items) : `${checked} de ${visits(items)}`;
  if (summary.before && summary.after) {
    return `${formatMoney(summary.before.withoutProducts.net)} → ${formatMoney(summary.after.withoutProducts.net)} + IVA`;
  }
  if (summary.after) return `${formatMoney(summary.after.withoutProducts.net)} + IVA`;
  const stored = summary.stored.find((option) => !option.hasProducts) ?? summary.stored[0];
  if (stored) return `${formatMoney(stored.net)} + IVA`;
  if (summary.changes.length === 1) {
    const [change] = summary.changes;
    return `${change.label}: ${formatChangeValue(change.field, change.after)}`;
  }
  if (summary.changes.length > 1) return plural(summary.changes.length, "cambio", "cambios");
  if (items === 1) return summary.items?.[0].label ?? null;
  return null;
};

// Lo que cambia, en el subtítulo de una tarjeta de cambiar: hasta dos.
export const changesLine = (summary: ProposalSummary) =>
  summary.changes.length > 0 && summary.changes.length <= 2
    ? summary.changes
        .map((change) => `${change.label} ${formatChangeValue(change.field, change.before)} → ${formatChangeValue(change.field, change.after)}`)
        .join(" · ")
    : null;

// Las visitas que se cruzan con otras y siguen marcadas.
export const countClashes = (summary: ProposalSummary, checked: boolean[] | null) =>
  (summary.items ?? []).filter((item, index) => item.detail && (checked?.[index] ?? true)).length;

export const clashLabel = (count: number) => (count === 1 ? "1 se cruza" : `${count} se cruzan`);

const DONE: Record<AgentProposalKind, string> = {
  CREATE_BUDGET: "Presupuesto creado",
  UPDATE_BUDGET: "Presupuesto guardado",
  DUPLICATE_BUDGET: "Copia creada",
  PUBLISH_OFFICIAL_BUDGET: "Precio oficial publicado",
  CREATE_VISITS: "Visitas agendadas",
  UPDATE_VISIT: "Visita cambiada",
  UPDATE_VISITS: "Visitas cambiadas",
  ARCHIVE_VISIT: "Visita sacada de la agenda",
  SAVE_MEMORY: "Guardado en la memoria",
  CHANGE_INSTRUCTIONS: "Instrucciones guardadas",
};

const OUTCOMES: Record<Exclude<ProposalDisplayStatus, "PENDING" | "CONFIRMED">, { title: string; detail: string | null }> = {
  EXECUTING: { title: "Guardando", detail: null },
  REJECTED: { title: "Rechazada", detail: "no se guardó nada" },
  EXPIRED: { title: "Vencida", detail: "pasaron 24 horas" },
  FAILED: { title: "No se guardó", detail: null },
  UNKNOWN: { title: "Resultado desconocido", detail: null },
};

// El recibo de una propuesta resuelta: título y lo que va después del punto.
export const receiptText = (
  kind: AgentProposalKind,
  status: ProposalDisplayStatus,
  summary: ProposalSummary,
  result: ProposalResult | null | undefined
) => {
  if (status === "PENDING") return null;
  if (status !== "CONFIRMED") {
    const outcome = OUTCOMES[status];
    return { title: outcome.title, detail: [summary.name, outcome.detail].filter(Boolean).join(" · ") };
  }
  const items = summary.items?.length ?? 0;
  if (items > 1) {
    const done = result?.visitIndexes?.length ?? items;
    const verb = kind === "CREATE_VISITS" ? ["agendada", "agendadas", "sin agendar"] : ["cambiada", "cambiadas", "sin cambios"];
    const skipped = items - done;
    return {
      title: `${done === 1 ? `1 visita ${verb[0]}` : `${done} visitas ${verb[1]}`}`,
      detail: [summary.name, skipped > 0 ? `${skipped} ${verb[2]}` : null].filter(Boolean).join(" · "),
    };
  }
  const figure = proposalFigure(kind, summary, null);
  return { title: DONE[kind], detail: [summary.name, figure].filter(Boolean).join(" · ") };
};

// "Vence hoy a las 17:40", "mañana a las 11:42" o "el 3 dic a las 9:00", en
// la hora de quien mira.
export const expiryText = (iso: string, now = new Date()) => {
  const date = new Date(iso);
  const time = format(date, "HH:mm");
  if (isSameDay(date, now)) return `Vence hoy a las ${time}`;
  if (isSameDay(date, addDays(now, 1))) return `Vence mañana a las ${time}`;
  return `Vence el ${format(date, "d MMM", { locale: es })} a las ${time}`;
};

// Lo que le escribe "Pedir de nuevo" al agente en la misma conversación.
export const requestAgainText = (summary: Pick<ProposalSummary, "title">, status: ProposalDisplayStatus) =>
  `Proponé de nuevo: ${summary.title}. La anterior ${status === "EXPIRED" ? "venció" : "no se pudo guardar"}; usá los datos de ahora.`;
