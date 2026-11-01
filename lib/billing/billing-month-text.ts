// El mes dentro del texto de una factura ("Limpieza de oficina - octubre
// 2026"). Al repetir un mes, el detalle y la adenda pasan al mes nuevo.
export const BILLING_MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const getBillingMonthName = (period: Date) => BILLING_MONTH_NAMES[period.getUTCMonth()];

// En Uruguay se escribe también "setiembre".
const monthPattern = (monthIndex: number) =>
  monthIndex === 8 ? "set?iembre" : BILLING_MONTH_NAMES[monthIndex];

const keepCase = (source: string, value: string) => {
  if (source === source.toUpperCase() && source !== source.toLowerCase()) return value.toUpperCase();
  return source[0] === source[0].toUpperCase() ? value[0].toUpperCase() + value.slice(1) : value;
};

const pad = (value: number) => String(value).padStart(2, "0");

// Pasa "octubre 2026", "octubre de 2026", "octubre" solo y "10/2026" al mes
// de `to`, conservando las mayúsculas. Lo que no nombra el mes queda igual.
export const moveMonthInText = (text: string, from: Date, to: Date) => {
  const fromMonth = from.getUTCMonth();
  const fromYear = from.getUTCFullYear();
  const toName = getBillingMonthName(to);
  const toYear = String(to.getUTCFullYear());
  const name = monthPattern(fromMonth);

  const withYear = new RegExp(`(?<![\\p{L}])(${name})(\\s+(?:de\\s+|del\\s+)?)${fromYear}(?!\\d)`, "giu");
  const alone = new RegExp(`(?<![\\p{L}])(${name})(?![\\p{L}])`, "giu");
  const numeric = new RegExp(`(?<!\\d)0?${fromMonth + 1}([/-])${fromYear}(?!\\d)`, "g");

  return text
    .replace(withYear, (_match, month: string, gap: string) => `${keepCase(month, toName)}${gap}${toYear}`)
    .replace(alone, (month: string) => keepCase(month, toName))
    .replace(numeric, (_match, separator: string) => `${pad(to.getUTCMonth() + 1)}${separator}${toYear}`);
};
