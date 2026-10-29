import type { FieldErrors } from "react-hook-form";

import type { BudgetFormValues } from "@/schemas/BudgetSchema";

// Los cinco pasos del creador: secciones en escritorio, pantallas en el celular.
export const CREATOR_STEPS = [
  {
    id: "detalle",
    label: "Detalle",
    description: "Cómo se llama y cómo lo vas a encontrar después en la lista.",
    fields: ["name", "description", "categoryIds"],
  },
  {
    id: "equipo",
    label: "Equipo y horas",
    description: "Con esto se calculan las horas del mes y la mano de obra.",
    fields: ["visits", "visit_type", "hours_per_visit", "employees", "nominal_hour"],
  },
  {
    id: "costos",
    label: "Costos directos",
    description: "Transporte, extras del mes y, si corresponde, los productos del servicio.",
    fields: ["transportation_cost", "extras", "products_price", "products_revenue_percent"],
  },
  {
    id: "precio",
    label: "Precio",
    description: "Elegí qué número fijás vos; los otros dos se calculan.",
    fields: ["revenue_percent", "iva"],
  },
  {
    id: "aportes",
    label: "Aportes y cargas",
    description: "Porcentajes sobre la mano de obra. Vienen con los valores de siempre.",
    fields: ["incidence_contribution", "company_contribution", "personal_contribution"],
  },
] as const satisfies ReadonlyArray<{
  description: string;
  fields: ReadonlyArray<keyof BudgetFormValues>;
  id: string;
  label: string;
}>;

export type CreatorStepId = (typeof CREATOR_STEPS)[number]["id"];

export const findStepWithError = (errors: FieldErrors<BudgetFormValues>) =>
  CREATOR_STEPS.find((step) => step.fields.some((field) => errors[field]))?.id;
