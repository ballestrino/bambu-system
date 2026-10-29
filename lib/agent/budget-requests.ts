import type { BudgetRequestInput } from "@/schemas/agent-mail-tools";

// Pedidos de presupuesto que llegan por correo, agrupados por servicio: dos
// pedidos del mismo lugar (hogar, oficina…) con la misma frecuencia, visitas,
// horas, empleadas y productos son el mismo presupuesto y llevan el mismo
// precio. Puro, con prueba; las búsquedas de precio están en
// lib/agent/tools/budget-requests.ts.
export type RequestedService = {
  place: BudgetRequestInput["place"];
  frequency: BudgetRequestInput["frequency"];
  visits: number;
  hoursPerVisit: number;
  employees: number;
  hasProducts: boolean | null;
};

export type BudgetRequestGroup = {
  key: string;
  service: RequestedService;
  label: string;
  requests: { emailRef: string | null; client: string | null }[];
};

const FREQUENCY_LABELS = { days: "puntuales", week: "por semana", month: "por mes" } as const;

const PLACE_LABELS = { hogar: "Hogar", oficina: "Oficina", edificio: "Edificio", otro: "Otro lugar" } as const;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const formatHours = (hours: number) => `${hours.toLocaleString("es-UY", { maximumFractionDigits: 2 })} h`;

export const toRequestedService = (request: BudgetRequestInput): RequestedService => ({
  place: request.place,
  frequency: request.frequency,
  visits: request.visits,
  hoursPerVisit: request.hoursPerVisit,
  employees: request.employees ?? 1,
  hasProducts: request.hasProducts,
});

export const describeRequestedService = (service: RequestedService) =>
  [
    PLACE_LABELS[service.place],
    `${plural(service.visits, "visita", "visitas")} ${FREQUENCY_LABELS[service.frequency]}`,
    `${formatHours(service.hoursPerVisit)} por visita`,
    plural(service.employees, "empleada", "empleadas"),
    service.hasProducts === null ? null : service.hasProducts ? "con productos" : "sin productos",
  ]
    .filter(Boolean)
    .join(" · ");

const serviceKey = (service: RequestedService) =>
  [
    service.place,
    service.frequency,
    service.visits,
    service.hoursPerVisit,
    service.employees,
    service.hasProducts === null ? "?" : service.hasProducts ? "con" : "sin",
  ].join("|");

// El mismo correo dos veces cuenta una. Los grupos con más pedidos van
// primero; a igual cantidad, en el orden en que llegaron.
export const groupBudgetRequests = (requests: BudgetRequestInput[]): BudgetRequestGroup[] => {
  const groups = new Map<string, BudgetRequestGroup>();
  const seen = new Set<string>();
  for (const request of requests) {
    const service = toRequestedService(request);
    const key = serviceKey(service);
    const dedupe = request.emailRef ? `${key}#${request.emailRef}` : null;
    if (dedupe && seen.has(dedupe)) continue;
    if (dedupe) seen.add(dedupe);
    const group = groups.get(key) ?? { key, service, label: describeRequestedService(service), requests: [] };
    group.requests.push({ emailRef: request.emailRef, client: request.client });
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.requests.length - a.requests.length);
};

// Qué opciones de precio van para el grupo: la pedida o, si no dice, las dos.
export const wantsOption = (service: RequestedService, hasProducts: boolean) =>
  service.hasProducts === null || service.hasProducts === hasProducts;
