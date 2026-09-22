import { PRODUCT_MARGIN_PCT } from "@/lib/budget-calculations";
import {
  URUGUAY_EMPLOYER_BPS_PERCENT,
  URUGUAY_PERSONAL_BPS_BASE_PERCENT,
} from "@/lib/ops/finance/payroll-accruals";
import { DEFAULT_OPS_TIMEZONE } from "@/lib/ops/timezone";
import { defaultBudgetValues } from "@/schemas/BudgetSchema";

// Única fuente de los datos del negocio que usa el agente. Lo que ya existe
// en el código se importa; check:agent-tools asserta el resto contra sus
// originales (transporte por visita, multiplicador semanal, productos).
export const LITERAL_E_NOTE =
  "Nota: Mientras la empresa continúe bajo régimen Literal E, se aplicará el monto sin IVA.";

export const BUSINESS_PROFILE = {
  name: "Bambú Servicios Integrales",
  phone: "096 800 006",
  website: "www.bambu-servicios.com",
  signature: "Equipo de Bambú Servicios Integrales",
  currency: "UYU",
  timeZone: DEFAULT_OPS_TIMEZONE,
  ivaPercent: defaultBudgetValues.iva,
  literalENote: LITERAL_E_NOTE,
  weeklyMultiplier: 4.32,
  transportPerVisit: 52,
  productsPricePerFourHours: 175,
  productMarginPercent: PRODUCT_MARGIN_PCT,
  // Reglas de precio del agente (feature 44): el total mensual del servicio
  // sin IVA sube al próximo múltiplo de priceStep y los productos van al
  // múltiplo de productsStep más cercano.
  priceStep: 100,
  productsStep: 500,
  employerBpsPercent: URUGUAY_EMPLOYER_BPS_PERCENT,
  personalBpsPercent: URUGUAY_PERSONAL_BPS_BASE_PERCENT,
  budgetDefaults: {
    nominalHour: defaultBudgetValues.nominal_hour,
    revenuePercent: defaultBudgetValues.revenue_percent,
    incidencePercent: defaultBudgetValues.incidence_contribution,
    companyPercent: defaultBudgetValues.company_contribution,
    personalPercent: defaultBudgetValues.personal_contribution,
  },
  payrollInArrears:
    "Los sueldos se pagan a mes vencido: lo que se paga en un mes liquida las horas trabajadas el mes anterior.",
} as const;

const percent = (value: number) =>
  `${value.toLocaleString("es-UY", { maximumFractionDigits: 3 })} %`;

// Bloque del prompt. Cada línea es un dato que el agente puede citar sin
// llamar a una tool.
export const formatBusinessProfile = () => {
  const profile = BUSINESS_PROFILE;
  const defaults = profile.budgetDefaults;
  return [
    `- Empresa: ${profile.name}. Teléfono ${profile.phone}, web ${profile.website}.`,
    `- Moneda: pesos uruguayos (${profile.currency}). IVA ${percent(profile.ivaPercent)}.`,
    `- Régimen Literal E: debajo de todo precio para un cliente va, textual: "${profile.literalENote}"`,
    `- Visitas semanales: por mes se multiplican por ${profile.weeklyMultiplier.toLocaleString("es-UY")}.`,
    `- Transporte: $ ${profile.transportPerVisit} por visita y por empleada (boletos).`,
    `- Productos: se estiman $ ${profile.productsPricePerFourHours} cada 4 horas de servicio, redondeado al múltiplo de $ ${profile.productsStep} más cercano (mínimo $ ${profile.productsStep}); margen opcional de ${percent(profile.productMarginPercent)}.`,
    `- Precio: el total mensual del servicio sin IVA sube al próximo múltiplo de $ ${profile.priceStep} (hasta $ ${profile.priceStep - 1} más) ajustando el margen, y el precio por hora se da redondeado a pesos. Lo hacen los cálculos: citá sus importes.`,
    `- Aportes BPS: patronales ${percent(profile.employerBpsPercent)}, personales ${percent(profile.personalBpsPercent)}.`,
    `- Presupuesto nuevo por defecto: hora nominal $ ${defaults.nominalHour}, margen ${percent(defaults.revenuePercent)}, incidencia ${percent(defaults.incidencePercent)}, aportes patronales ${percent(defaults.companyPercent)} y personales ${percent(defaults.personalPercent)}.`,
    `- ${profile.payrollInArrears}`,
    `- Zona horaria: ${profile.timeZone}. Firma de los correos: ${profile.signature}.`,
  ].join("\n");
};
