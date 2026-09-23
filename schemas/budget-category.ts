import * as z from "zod";

export const BudgetCategoryIdSchema = z.string().cuid({ message: "Categoría inválida" });

export const BudgetCategoryFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(80, { message: "El nombre puede tener hasta 80 caracteres" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "La descripción puede tener hasta 500 caracteres" }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Color inválido" }),
  isActive: z.boolean(),
});

export const CreateBudgetCategorySchema = BudgetCategoryFieldsSchema.extend({
  parentCategoryId: BudgetCategoryIdSchema.optional(),
});

export const UpdateBudgetCategorySchema = BudgetCategoryFieldsSchema.extend({
  id: BudgetCategoryIdSchema,
});

export type CreateBudgetCategoryValues = z.infer<typeof CreateBudgetCategorySchema>;
export type UpdateBudgetCategoryValues = z.infer<typeof UpdateBudgetCategorySchema>;
