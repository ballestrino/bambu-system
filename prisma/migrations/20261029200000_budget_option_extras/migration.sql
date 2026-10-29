-- Extras de los presupuestos (feature 36). Aditiva: una columna con valor por
-- defecto, las opciones existentes quedan con una lista vacía.
-- AlterTable
ALTER TABLE "BudgetOption" ADD COLUMN "extras" JSONB NOT NULL DEFAULT '[]';
