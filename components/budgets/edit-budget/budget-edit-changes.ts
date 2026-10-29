import {
  formatBudgetMoney,
  formatBudgetNumber,
} from "@/components/budgets/create-budget/budget-summary-model";
import type { CreatorStepId } from "@/components/budgets/create-budget/creator-steps";
import { sumBudgetExtras } from "@/lib/budget-extras";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type Field = keyof BudgetFormValues;
type Values = Partial<Record<Field, unknown>>;

export type BudgetEditChange = {
  field: Field | "slug";
  from: string;
  label: string;
  section: CreatorStepId;
  to: string;
};

const money = (value: unknown) => formatBudgetMoney(Number(value) || 0);
const percent = (value: unknown) => `${formatBudgetNumber(Number(value) || 0)}%`;
const number = (value: unknown) => formatBudgetNumber(Number(value) || 0);
const onOff = (value: unknown) => (value ? "prendido" : "apagado");
const FREQUENCY: Record<string, string> = { days: "Por día", month: "Mensual", week: "Semanal" };

// Los extras se comparan por nombre y monto; las filas vacías no cuentan.
const cleanExtras = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map((item) => ({ amount: Number(item?.amount) || 0, name: String(item?.name ?? "").trim() }))
    .filter((extra) => extra.name || extra.amount > 0);

const extrasLabel = (value: unknown) => {
  const extras = cleanExtras(value);
  if (!extras.length) return "sin extras";
  return `${extras.length} ${extras.length === 1 ? "extra" : "extras"} · ${formatBudgetMoney(sumBudgetExtras(extras))}`;
};

type Tracked = {
  field: Field;
  format: (value: unknown) => string;
  key?: (value: unknown) => string;
  label: string;
  section: CreatorStepId;
};

const TRACKED: Tracked[] = [
  { field: "name", format: (value) => String(value ?? "").trim() || "sin nombre", label: "Nombre", section: "detalle" },
  { field: "description", format: (value) => String(value ?? "").trim() || "sin descripción", label: "Descripción", section: "detalle" },
  {
    field: "categoryIds",
    format: (value) => `${Array.isArray(value) ? value.length : 0} categorías`,
    key: (value) => (Array.isArray(value) ? [...value].sort().join(",") : ""),
    label: "Categorías",
    section: "detalle",
  },
  { field: "visit_type", format: (value) => FREQUENCY[String(value)] ?? String(value), label: "Frecuencia", section: "equipo" },
  { field: "visits", format: number, label: "Visitas", section: "equipo" },
  { field: "hours_per_visit", format: (value) => `${number(value)} hs`, label: "Horas por visita", section: "equipo" },
  { field: "employees", format: number, label: "Empleados", section: "equipo" },
  { field: "nominal_hour", format: money, label: "Hora nominal", section: "equipo" },
  { field: "transportation_cost", format: money, label: "Transporte", section: "costos" },
  { field: "extras", format: extrasLabel, key: (value) => JSON.stringify(cleanExtras(value)), label: "Extras", section: "costos" },
  { field: "products_price", format: money, label: "Productos", section: "costos" },
  { field: "products_revenue_percent", format: percent, label: "Ganancia de productos", section: "costos" },
  { field: "revenue_percent", format: percent, label: "Ganancia", section: "precio" },
  { field: "iva", format: percent, label: "IVA", section: "precio" },
  { field: "personal_enabled", format: onOff, label: "Aportes personales", section: "aportes" },
  { field: "personal_contribution", format: percent, label: "Aportes personales (%)", section: "aportes" },
  { field: "company_enabled", format: onOff, label: "Aportes patronales", section: "aportes" },
  { field: "company_contribution", format: percent, label: "Aportes patronales (%)", section: "aportes" },
  { field: "incidence_enabled", format: onOff, label: "Aguinaldo y vacacional", section: "aportes" },
  { field: "incidence_contribution", format: percent, label: "Aguinaldo y vacacional (%)", section: "aportes" },
];

// Lo que cambió respecto de lo guardado, comparado como se muestra: una
// ganancia que difiere en el sexto decimal no es un cambio.
export const listBudgetChanges = (saved: Values, current: Values, savedSlug: string, slug: string) => {
  const changes: BudgetEditChange[] = TRACKED.flatMap((item) => {
    const key = item.key ?? item.format;
    if (key(saved[item.field]) === key(current[item.field])) return [];
    return [{ field: item.field, from: item.format(saved[item.field]), label: item.label, section: item.section, to: item.format(current[item.field]) }];
  });
  if (slug.trim() !== savedSlug) {
    changes.unshift({ field: "slug", from: `/${savedSlug}`, label: "Dirección", section: "detalle", to: `/${slug.trim()}` });
  }
  return changes;
};
