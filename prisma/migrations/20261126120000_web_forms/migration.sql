-- CreateEnum
CREATE TYPE "WebFormKind" AS ENUM ('CONTACT', 'JOB_APPLICATION');

-- CreateEnum
CREATE TYPE "WebFormStatus" AS ENUM ('NEW', 'REPLIED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "WebFormSubmission" (
    "id" TEXT NOT NULL,
    "externalId" VARCHAR(64) NOT NULL,
    "kind" "WebFormKind" NOT NULL,
    "status" "WebFormStatus" NOT NULL DEFAULT 'NEW',
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "service" VARCHAR(120),
    "location" VARCHAR(160),
    "message" TEXT NOT NULL,
    "fromTrebol" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebFormAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebFormAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebFormReply" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "requestId" VARCHAR(64) NOT NULL,
    "fromAddress" VARCHAR(254) NOT NULL,
    "toAddress" VARCHAR(254) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "messageId" VARCHAR(255),
    "savedToSent" BOOLEAN NOT NULL DEFAULT false,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebFormReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebFormSubmission_externalId_key" ON "WebFormSubmission"("externalId");

-- CreateIndex
CREATE INDEX "WebFormSubmission_status_createdAt_idx" ON "WebFormSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WebFormSubmission_email_idx" ON "WebFormSubmission"("email");

-- CreateIndex
CREATE INDEX "WebFormSubmission_handledById_idx" ON "WebFormSubmission"("handledById");

-- CreateIndex
CREATE UNIQUE INDEX "WebFormAttachment_submissionId_key" ON "WebFormAttachment"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "WebFormReply_requestId_key" ON "WebFormReply"("requestId");

-- CreateIndex
CREATE INDEX "WebFormReply_submissionId_createdAt_idx" ON "WebFormReply"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "WebFormReply_sentById_idx" ON "WebFormReply"("sentById");

-- AddForeignKey
ALTER TABLE "WebFormSubmission" ADD CONSTRAINT "WebFormSubmission_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebFormAttachment" ADD CONSTRAINT "WebFormAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WebFormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebFormReply" ADD CONSTRAINT "WebFormReply_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WebFormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebFormReply" ADD CONSTRAINT "WebFormReply_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

