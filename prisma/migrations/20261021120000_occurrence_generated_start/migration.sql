-- Aditiva: el inicio que la regla le dio a cada visita, para que "Generar
-- visitas" no vuelva a llenar el inicio de una visita movida o separada.
-- Las filas existentes quedan en null hasta el backfill.
ALTER TABLE "JobOccurrence" ADD COLUMN "generatedStartAt" TIMESTAMP(3);

CREATE INDEX "JobOccurrence_jobId_generatedStartAt_idx" ON "JobOccurrence"("jobId", "generatedStartAt");
