-- Instrucciones del equipo para el agente (feature 35). Aditiva: tabla nueva
-- y un tipo de propuesta nuevo. No toca filas existentes.
-- AlterEnum
ALTER TYPE "AgentProposalKind" ADD VALUE 'CHANGE_INSTRUCTIONS';

-- CreateTable
CREATE TABLE "AgentInstructionVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "rules" JSONB NOT NULL,
    "change" JSONB NOT NULL,
    "createdById" TEXT,
    "sourceConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentInstructionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentInstructionVersion_version_key" ON "AgentInstructionVersion"("version");

-- CreateIndex
CREATE INDEX "AgentInstructionVersion_createdById_idx" ON "AgentInstructionVersion"("createdById");

-- CreateIndex
CREATE INDEX "AgentInstructionVersion_sourceConversationId_idx" ON "AgentInstructionVersion"("sourceConversationId");

-- AddForeignKey
ALTER TABLE "AgentInstructionVersion" ADD CONSTRAINT "AgentInstructionVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInstructionVersion" ADD CONSTRAINT "AgentInstructionVersion_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "AgentConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
