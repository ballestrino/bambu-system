import { format } from "date-fns";
import { es } from "date-fns/locale";

// Formatos de las tarjetas del agente, en pesos uruguayos y es-UY.
const money = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2 });

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const formatMoney = (value: unknown) => (isNumber(value) ? money.format(value) : "—");

export const formatNumber = (value: unknown) => (isNumber(value) ? number.format(value) : "—");

export const formatPercent = (value: unknown) => (isNumber(value) ? `${number.format(value)} %` : "—");

export const formatHours = (value: unknown) => (isNumber(value) ? `${number.format(value)} h` : "—");

// "setiembre de 2026" → "Setiembre de 2026". El capitalize de CSS pondría
// también "De".
export const capitalizeFirst = (text: string) =>
  text ? `${text[0].toLocaleUpperCase("es-UY")}${text.slice(1)}` : text;

// Fechas guardadas (ISO) en la zona del navegador: la de quien mira.
export const formatDateTime = (iso: string | null | undefined) =>
  iso ? format(new Date(iso), "d MMM yyyy, HH:mm", { locale: es }) : "—";

export const formatDate = (iso: string | null | undefined) =>
  iso ? format(new Date(iso), "d MMM yyyy", { locale: es }) : "—";

const VISIT_TYPES: Record<string, string> = {
  days: "por día",
  week: "por semana",
  month: "por mes",
};

// "2 visitas por semana"
export const formatVisits = (visits: unknown, visitType: unknown) =>
  `${formatNumber(visits)} ${visits === 1 ? "visita" : "visitas"} ${VISIT_TYPES[String(visitType)] ?? ""}`.trim();

const PERCENT_FIELDS = new Set([
  "revenue_percent", "products_revenue_percent", "iva",
  "incidence_contribution", "company_contribution", "personal_contribution",
]);
const MONEY_FIELDS = new Set(["transportation_cost", "products_price", "nominal_hour"]);

// Un valor de la lista de cambios de una propuesta, según su campo.
export const formatChangeValue = (field: string, value: string | number | boolean | null) => {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (field === "visit_type") return VISIT_TYPES[String(value)] ?? String(value);
  if (typeof value !== "number") return value;
  if (PERCENT_FIELDS.has(field)) return formatPercent(value);
  return MONEY_FIELDS.has(field) ? formatMoney(value) : formatNumber(value);
};
