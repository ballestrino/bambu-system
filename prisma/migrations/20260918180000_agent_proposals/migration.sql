-- Propuestas del agente de Bambú: escrituras que el agente prepara durante el
-- turno y que solo se ejecutan al confirmarlas. Aditiva: no toca Budget ni las
-- tablas del workspace. Se borran con la conversación o con quien las propuso;
-- la auditoría queda en AgentAuditEvent.
-- CreateEnum
CREATE TYPE "AgentProposalKind" AS ENUM ('CREATE_BUDGET', 'UPDATE_BUDGET', 'DUPLICATE_BUDGET', 'PUBLISH_OFFICIAL_BUDGET');

-- CreateEnum
CREATE TYPE "AgentProposalStatus" AS ENUM ('PENDING', 'EXECUTING', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "AgentProposal" (
    "id" TEXT NOT NULL,
    "kind" "AgentProposalKind" NOT NULL,
    "status" "AgentProposalStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "toolCallId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentProposal_conversationId_createdAt_idx" ON "AgentProposal"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentProposal_actorId_createdAt_idx" ON "AgentProposal"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProposal_conversationId_toolCallId_key" ON "AgentProposal"("conversationId", "toolCallId");

-- AddForeignKey
ALTER TABLE "AgentProposal" ADD CONSTRAINT "AgentProposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProposal" ADD CONSTRAINT "AgentProposal_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

