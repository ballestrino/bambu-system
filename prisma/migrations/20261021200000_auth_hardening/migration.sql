-- Aditiva: límites de intentos de auth y versión de sesión. Las sesiones
-- emitidas antes no tienen versión y se cierran una vez al desplegar.
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthAttempt_scope_key_createdAt_idx" ON "AuthAttempt"("scope", "key", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_createdAt_idx" ON "AuthAttempt"("createdAt");

