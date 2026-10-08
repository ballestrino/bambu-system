-- Imágenes adjuntas a los mensajes del agente y dictado con gpt-transcribe
-- (feature 23). Aditiva: los consumos anteriores quedan con 0 segundos de
-- audio y las tablas existentes no cambian.
-- AlterEnum
ALTER TYPE "AgentUsageKind" ADD VALUE 'TRANSCRIPTION';

-- AlterTable
ALTER TABLE "AgentUsageEvent" ADD COLUMN     "audioSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AgentAttachment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT,
    "mediaType" TEXT NOT NULL,
    "filename" TEXT,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentAttachment_messageId_idx" ON "AgentAttachment"("messageId");

-- CreateIndex
CREATE INDEX "AgentAttachment_userId_createdAt_idx" ON "AgentAttachment"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgentAttachment" ADD CONSTRAINT "AgentAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAttachment" ADD CONSTRAINT "AgentAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AgentMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

