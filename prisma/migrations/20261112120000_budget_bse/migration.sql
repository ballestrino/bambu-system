-- BSE (Banco de Seguros del Estado) en % del sueldo nominal. NULL: presupuesto
-- guardado antes del BSE, que se calcula a mano desde el editor.
ALTER TABLE "BudgetOption" ADD COLUMN "bse_contribution" DOUBLE PRECISION;
