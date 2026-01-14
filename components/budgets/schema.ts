import * as z from "zod";

export const VisitTypeEnum = z.enum(["days", "week", "month"]);

export const BudgetSchema = z.object({
  // Info
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visits: z.coerce.number().min(0, "Must be positive"),
  visit_type: VisitTypeEnum,
  hours_per_visit: z.coerce.number().min(0),
  nominal_hour: z.coerce.number().min(0),
  nominal_salary: z.coerce.number().min(0),
  employees: z.coerce.number().min(1, "At least 1 employee"),

  // Contributions
  incidence_contribution: z.coerce.number().min(0),
  incidence_enabled: z.boolean().default(true),
  company_contribution: z.coerce.number().min(0),
  company_enabled: z.boolean().default(true),
  personal_contribution: z.coerce.number().min(0),
  personal_enabled: z.boolean().default(true),

  // Extra costs
  transportation_cost: z.coerce.number().min(0),
  products_price: z.coerce.number().min(0),
  products_iva: z.coerce.number().min(0),

  // Revenues
  products_revenue_percent: z.coerce.number().min(0),
  revenue_percent: z.coerce.number().min(0),

  // Price
  price: z.coerce.number().min(0),
  iva: z.coerce.number().min(0),
});

export type BudgetFormValues = z.infer<typeof BudgetSchema>;

export const defaultBudgetValues: BudgetFormValues = {
  name: "Doméstica 1xSem 4hs",
  description: "Servicio doméstico 1 visita por semana de 4 horas",
  visits: 1,
  visit_type: "week",
  hours_per_visit: 4,
  nominal_hour: 220,
  nominal_salary: 0,
  employees: 1,
  
  incidence_contribution: 13.415,
  incidence_enabled: true,
  company_contribution: 12.625,
  company_enabled: true,
  personal_contribution: 18.1,
  personal_enabled: true,

  transportation_cost: 224.64,
  products_price: 756,
  products_iva: 0,
  products_revenue_percent: 15,
  revenue_percent: 45,
  price: 7273.46,
  iva: 22, // Default IVA
};
