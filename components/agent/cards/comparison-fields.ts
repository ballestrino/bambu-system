import {
  formatHours,
  formatMoney,
  formatNumber,
  formatPercent,
  formatVisits,
} from "@/components/agent/format";
import {
  pickComparisonOption,
  type ComparisonColumn,
  type ComparisonPriceOption,
} from "@/lib/agent/budget-comparison";

// Los campos de la tabla comparativa (feature 71): una fila por campo, una
// columna por escenario. Quien mira elige cuáles ver; la elección se recuerda
// en el navegador (comparison-preference.ts). Puro: lo usan la tarjeta, el
// copiado y el check.
export type ComparisonFieldId =
  | "service" | "hours" | "labor" | "contributions" | "transport" | "extras" | "products"
  | "cost" | "margin" | "net" | "final" | "hourly" | "profit" | "profitPercent";

type ComparisonField = {
  id: ComparisonFieldId;
  label: string;
  // Las filas que mandan (precio y ganancia) van en negrita.
  strong?: boolean;
  value: (column: ComparisonColumn, option: ComparisonPriceOption) => string;
};

const pick = pickComparisonOption;

const describeService = (column: ComparisonColumn) =>
  [
    formatVisits(column.visits, column.visitType),
    formatHours(column.hoursPerVisit),
    `${formatNumber(column.employees)} ${column.employees === 1 ? "empleada" : "empleadas"}`,
  ].join(" · ");

export const COMPARISON_FIELDS: readonly ComparisonField[] = [
  { id: "service", label: "Servicio", value: describeService },
  { id: "hours", label: "Horas al mes", value: (c) => formatHours(c.totalHours) },
  { id: "labor", label: "Mano de obra", value: (c) => formatMoney(c.laborCost) },
  { id: "contributions", label: "Aportes", value: (c) => formatMoney(c.contributions) },
  { id: "transport", label: "Transporte", value: (c) => formatMoney(c.transport) },
  { id: "extras", label: "Extras", value: (c) => formatMoney(c.extras) },
  { id: "products", label: "Productos (costo)", value: (c) => formatMoney(c.products) },
  { id: "cost", label: "Costo total", value: (c, o) => formatMoney(pick(c, o).cost) },
  { id: "margin", label: "Margen sobre el costo", value: (c) => formatPercent(c.revenuePercent) },
  { id: "net", label: "Precio sin IVA", strong: true, value: (c, o) => formatMoney(pick(c, o).net) },
  { id: "final", label: "Precio con IVA", value: (c, o) => formatMoney(pick(c, o).final) },
  { id: "hourly", label: "Precio hora sin IVA", value: (c, o) => formatMoney(pick(c, o).hourlyNet) },
  { id: "profit", label: "Ganancia mensual", strong: true, value: (c, o) => formatMoney(pick(c, o).profit) },
  { id: "profitPercent", label: "% de ganancia", value: (c, o) => formatPercent(pick(c, o).profitPercent) },
];

export const COMPARISON_FIELD_IDS = COMPARISON_FIELDS.map((field) => field.id);

export const DEFAULT_COMPARISON_FIELDS: readonly ComparisonFieldId[] = [
  "service", "net", "hourly", "profit", "profitPercent",
];

export const isComparisonFieldId = (value: unknown): value is ComparisonFieldId =>
  typeof value === "string" && (COMPARISON_FIELD_IDS as string[]).includes(value);

// En el orden de la tabla, no en el que se marcaron.
export const visibleComparisonFields = (selected: readonly ComparisonFieldId[]) =>
  COMPARISON_FIELDS.filter((field) => selected.includes(field.id));

export const OPTION_LABELS: Record<ComparisonPriceOption, string> = {
  without: "Sin productos",
  with: "Con productos",
};

// Un escenario sin productos usa sus precios sin productos también en la
// vista con productos: se avisa, para que no parezca que los lleva.
export const hasAnyProducts = (columns: readonly ComparisonColumn[]) =>
  columns.some((column) => column.withProducts !== null);
