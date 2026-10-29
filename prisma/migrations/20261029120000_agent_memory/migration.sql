-- Memoria del agente (feature 34). Aditiva: tabla nueva, un tipo de
-- propuesta nuevo y una copia del conocimiento aprobado de MailMemory, que
-- queda como estaba.
-- AlterEnum
ALTER TYPE "AgentProposalKind" ADD VALUE 'SAVE_MEMORY';

-- CreateEnum
CREATE TYPE "AgentMemoryKind" AS ENUM ('BUSINESS', 'CLIENT', 'STYLE', 'PRICE');

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "kind" "AgentMemoryKind" NOT NULL,
    "text" TEXT NOT NULL,
    "sourceConversationId" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentMemory_expiresAt_idx" ON "AgentMemory"("expiresAt");

-- CreateIndex
CREATE INDEX "AgentMemory_kind_updatedAt_idx" ON "AgentMemory"("kind", "updatedAt");

-- CreateIndex
CREATE INDEX "AgentMemory_sourceConversationId_idx" ON "AgentMemory"("sourceConversationId");

-- CreateIndex
CREATE INDEX "AgentMemory_createdById_idx" ON "AgentMemory"("createdById");

-- CreateIndex
CREATE INDEX "AgentMemory_approvedById_idx" ON "AgentMemory"("approvedById");

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "AgentConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lo que el agente leía de MailMemory (aprobado, sin contactos) pasa a su
-- memoria: organización y políticas como Negocio, estilo como Estilo.
INSERT INTO "AgentMemory" ("id", "kind", "text", "approvedById", "approvedAt", "expiresAt", "createdAt", "updatedAt")
SELECT
    'mail_' || "id",
    CASE "scope" WHEN 'STYLE' THEN 'STYLE'::"AgentMemoryKind" ELSE 'BUSINESS'::"AgentMemoryKind" END,
    LEFT("key" || ': ' || "value", 500),
    "approvedById",
    COALESCE("approvedAt", "updatedAt"),
    "validUntil",
    "createdAt",
    "updatedAt"
FROM "MailMemory"
WHERE "status" = 'APPROVED'
  AND "scope" IN ('ORGANIZATION', 'POLICY', 'STYLE')
  AND "contactEmail" IS NULL;
