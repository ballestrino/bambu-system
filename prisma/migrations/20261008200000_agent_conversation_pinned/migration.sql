-- Conversaciones fijadas del agente (feature 24). Aditiva: las existentes
-- quedan sin fijar (NULL).
-- AlterTable
ALTER TABLE "AgentConversation" ADD COLUMN     "pinnedAt" TIMESTAMP(3);
