CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "MailDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "MailMessageState" AS ENUM ('RECEIVED', 'QUEUED', 'SENT', 'FAILED');
CREATE TYPE "MailSuggestionStatus" AS ENUM ('PENDING', 'READY', 'APPROVED', 'EDITED', 'REJECTED', 'SENT', 'FAILED');
CREATE TYPE "MailMemoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "MailMemoryScope" AS ENUM ('STYLE', 'POLICY', 'CONTACT', 'ORGANIZATION');
CREATE TYPE "MailRuleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "MailQueueStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'CANCELLED', 'FAILED');
CREATE TYPE "MailFeedbackOutcome" AS ENUM ('ACCEPTED', 'EDITED', 'REJECTED', 'MANUAL_SENT');
CREATE TYPE "MailSyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');

CREATE TABLE "MailSettings" (
    "id" TEXT NOT NULL DEFAULT 'shared',
    "autoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailSyncState" (
    "id" TEXT NOT NULL DEFAULT 'shared',
    "initialImportSince" TIMESTAMP(3),
    "initialImportDone" BOOLEAN NOT NULL DEFAULT false,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailSyncState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailFolderCursor" (
    "id" TEXT NOT NULL,
    "folderKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "uidValidity" TEXT,
    "lastUid" TEXT,
    "initialImportComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailFolderCursor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailSyncRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "MailSyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "suggestionCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "MailSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailThread" (
    "id" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "normalizedSubject" TEXT NOT NULL,
    "participantEmails" TEXT[],
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "lastInboundAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "folderKey" TEXT NOT NULL,
    "uidValidity" TEXT NOT NULL,
    "providerUid" TEXT NOT NULL,
    "internetMessageId" TEXT,
    "inReplyTo" TEXT,
    "referenceIds" TEXT[],
    "direction" "MailDirection" NOT NULL,
    "state" "MailMessageState" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "toAddresses" TEXT[],
    "ccAddresses" TEXT[],
    "bccAddresses" TEXT[],
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "receivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "requiresHandoff" BOOLEAN NOT NULL DEFAULT false,
    "autoSubmitted" TEXT,
    "listId" TEXT,
    "headers" JSONB,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "contentId" TEXT,
    "providerPartId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailSuggestion" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "status" "MailSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reasoningEffort" TEXT NOT NULL DEFAULT 'high',
    "intent" TEXT,
    "isComplex" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT,
    "confidence" DOUBLE PRECISION,
    "safetyConfidence" DOUBLE PRECISION,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "subject" TEXT,
    "body" TEXT,
    "reasons" TEXT[],
    "protectedLiterals" TEXT[],
    "error" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailMemory" (
    "id" TEXT NOT NULL,
    "scope" "MailMemoryScope" NOT NULL,
    "status" "MailMemoryStatus" NOT NULL DEFAULT 'PENDING',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "contactEmail" TEXT,
    "sourceMessageId" TEXT,
    "validUntil" TIMESTAMP(3),
    "embedding" vector(1536),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailMemory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailAutoReplyRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MailRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "exampleMessageId" TEXT NOT NULL,
    "exampleReplySubject" TEXT NOT NULL,
    "exampleReplyBody" TEXT NOT NULL,
    "normalizedInputHash" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "similarityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "protectedLiterals" TEXT[],
    "allowContextAdaptation" BOOLEAN NOT NULL DEFAULT true,
    "embedding" vector(1536),
    "createdById" TEXT NOT NULL,
    "lastMatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailAutoReplyRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailAutoReplyQueue" (
    "id" TEXT NOT NULL,
    "inboundMessageId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "status" "MailQueueStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "leaseUntil" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "cancelReason" TEXT,
    "lastError" TEXT,
    "sentMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailAutoReplyQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailDraftFeedback" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT,
    "sourceMessageId" TEXT,
    "actorId" TEXT NOT NULL,
    "outcome" "MailFeedbackOutcome" NOT NULL,
    "originalBody" TEXT,
    "finalBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailDraftFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailAuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MailSettings_updatedById_idx" ON "MailSettings"("updatedById");
CREATE UNIQUE INDEX "MailFolderCursor_folderKey_key" ON "MailFolderCursor"("folderKey");
CREATE INDEX "MailSyncRun_startedAt_idx" ON "MailSyncRun"("startedAt");
CREATE INDEX "MailSyncRun_status_startedAt_idx" ON "MailSyncRun"("status", "startedAt");
CREATE UNIQUE INDEX "MailThread_threadKey_key" ON "MailThread"("threadKey");
CREATE INDEX "MailThread_lastMessageAt_idx" ON "MailThread"("lastMessageAt");
CREATE INDEX "MailThread_isArchived_lastMessageAt_idx" ON "MailThread"("isArchived", "lastMessageAt");
CREATE INDEX "MailThread_unreadCount_lastMessageAt_idx" ON "MailThread"("unreadCount", "lastMessageAt");
CREATE INDEX "MailThread_subject_trgm_idx" ON "MailThread" USING GIN ("subject" gin_trgm_ops);
CREATE INDEX "MailThread_normalizedSubject_trgm_idx" ON "MailThread" USING GIN ("normalizedSubject" gin_trgm_ops);
CREATE INDEX "MailMessage_threadId_receivedAt_idx" ON "MailMessage"("threadId", "receivedAt");
CREATE INDEX "MailMessage_threadId_sentAt_idx" ON "MailMessage"("threadId", "sentAt");
CREATE INDEX "MailMessage_internetMessageId_idx" ON "MailMessage"("internetMessageId");
CREATE INDEX "MailMessage_direction_state_idx" ON "MailMessage"("direction", "state");
CREATE INDEX "MailMessage_isRead_isArchived_idx" ON "MailMessage"("isRead", "isArchived");
CREATE UNIQUE INDEX "MailMessage_folderKey_uidValidity_providerUid_key" ON "MailMessage"("folderKey", "uidValidity", "providerUid");
CREATE INDEX "MailMessage_embedding_hnsw_idx" ON "MailMessage" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "MailAttachment_messageId_idx" ON "MailAttachment"("messageId");
CREATE UNIQUE INDEX "MailSuggestion_messageId_key" ON "MailSuggestion"("messageId");
CREATE INDEX "MailSuggestion_status_createdAt_idx" ON "MailSuggestion"("status", "createdAt");
CREATE INDEX "MailSuggestion_reviewedById_idx" ON "MailSuggestion"("reviewedById");
CREATE INDEX "MailMemory_status_scope_idx" ON "MailMemory"("status", "scope");
CREATE INDEX "MailMemory_contactEmail_status_idx" ON "MailMemory"("contactEmail", "status");
CREATE INDEX "MailMemory_approvedById_idx" ON "MailMemory"("approvedById");
CREATE INDEX "MailMemory_embedding_hnsw_idx" ON "MailMemory" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "MailAutoReplyRule_status_intent_idx" ON "MailAutoReplyRule"("status", "intent");
CREATE INDEX "MailAutoReplyRule_normalizedInputHash_idx" ON "MailAutoReplyRule"("normalizedInputHash");
CREATE INDEX "MailAutoReplyRule_createdById_idx" ON "MailAutoReplyRule"("createdById");
CREATE INDEX "MailAutoReplyRule_embedding_hnsw_idx" ON "MailAutoReplyRule" USING hnsw ("embedding" vector_cosine_ops);
CREATE UNIQUE INDEX "MailAutoReplyQueue_inboundMessageId_key" ON "MailAutoReplyQueue"("inboundMessageId");
CREATE UNIQUE INDEX "MailAutoReplyQueue_idempotencyKey_key" ON "MailAutoReplyQueue"("idempotencyKey");
CREATE INDEX "MailAutoReplyQueue_status_scheduledFor_idx" ON "MailAutoReplyQueue"("status", "scheduledFor");
CREATE INDEX "MailAutoReplyQueue_ruleId_idx" ON "MailAutoReplyQueue"("ruleId");
CREATE INDEX "MailAutoReplyQueue_suggestionId_idx" ON "MailAutoReplyQueue"("suggestionId");
CREATE INDEX "MailDraftFeedback_suggestionId_idx" ON "MailDraftFeedback"("suggestionId");
CREATE INDEX "MailDraftFeedback_sourceMessageId_idx" ON "MailDraftFeedback"("sourceMessageId");
CREATE INDEX "MailDraftFeedback_actorId_createdAt_idx" ON "MailDraftFeedback"("actorId", "createdAt");
CREATE INDEX "MailAuditEvent_createdAt_idx" ON "MailAuditEvent"("createdAt");
CREATE INDEX "MailAuditEvent_entityType_entityId_idx" ON "MailAuditEvent"("entityType", "entityId");
CREATE INDEX "MailAuditEvent_actorId_createdAt_idx" ON "MailAuditEvent"("actorId", "createdAt");

ALTER TABLE "MailSettings" ADD CONSTRAINT "MailSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MailAttachment" ADD CONSTRAINT "MailAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MailSuggestion" ADD CONSTRAINT "MailSuggestion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MailSuggestion" ADD CONSTRAINT "MailSuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailMemory" ADD CONSTRAINT "MailMemory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailAutoReplyRule" ADD CONSTRAINT "MailAutoReplyRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailAutoReplyQueue" ADD CONSTRAINT "MailAutoReplyQueue_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "MailAutoReplyRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailAutoReplyQueue" ADD CONSTRAINT "MailAutoReplyQueue_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MailSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailDraftFeedback" ADD CONSTRAINT "MailDraftFeedback_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MailSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MailDraftFeedback" ADD CONSTRAINT "MailDraftFeedback_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "MailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MailDraftFeedback" ADD CONSTRAINT "MailDraftFeedback_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MailAuditEvent" ADD CONSTRAINT "MailAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
