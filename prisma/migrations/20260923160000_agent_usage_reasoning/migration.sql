-- Razonamiento de cada consumo del agente (feature 45). Aditiva: los
-- consumos anteriores quedan en NULL.
ALTER TABLE "AgentUsageEvent" ADD COLUMN "reasoning" TEXT;
