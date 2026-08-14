import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { recordMailAudit } from "@/lib/mail-agent/audit";
import { considerMailAutomation } from "@/lib/mail-agent/automation";
import {
  getMailConfigurationStatus,
  getMailRuntimeConfig,
  MAIL_IMPORT_MONTHS,
  MAIL_SUGGESTION_BATCH_SIZE,
} from "@/lib/mail-agent/config";
import { embedHistoricalSentMail } from "@/lib/mail-agent/embedding";
import { registerCustomMailFolders } from "@/lib/mail-agent/folder-registry";
import { generateAndStoreMailSuggestion } from "@/lib/mail-agent/draft";
import {
  createMailImapClient,
  resolveMailboxFolders,
  resolveSyncFolders,
} from "@/lib/mail-agent/imap-client";
import { getMailSafetyIdentifier } from "@/lib/mail-agent/openai-client";
import {
  repairInboxMailDirections,
  repairSelfAddressedInboxThreads,
} from "@/lib/mail-agent/repair";
import { syncMailFolder } from "@/lib/mail-agent/sync-folder";

type SyncSource = "manual" | "cron";

const getImportSince = () => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - MAIL_IMPORT_MONTHS);
  return date;
};

const acquireSyncLease = async () => {
  const now = new Date();
  const leaseToken = randomUUID();
  const leaseUntil = new Date(now.getTime() + 12 * 60_000);
  await db.mailSyncState.upsert({
    where: { id: "shared" },
    create: { id: "shared", initialImportSince: getImportSince() },
    update: {},
  });
  const result = await db.mailSyncState.updateMany({
    where: {
      id: "shared",
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
    },
    data: { leaseToken, leaseUntil },
  });
  return result.count ? leaseToken : null;
};

export const syncSharedMailbox = async (
  source: SyncSource,
  actorId?: string
) => {
  const configuration = getMailConfigurationStatus();
  if (!configuration.mailReady) {
    throw new Error(`Falta configurar: ${configuration.missingMail.join(", ")}`);
  }
  const leaseToken = await acquireSyncLease();
  if (!leaseToken) return { skipped: true, reason: "sync_in_progress" } as const;

  const state = await db.mailSyncState.findUniqueOrThrow({ where: { id: "shared" } });
  const run = await db.mailSyncRun.create({ data: { source } });
  const client = createMailImapClient();
  try {
    await client.connect();
    const listedFolders = await client.list();
    const mailboxFolders = resolveMailboxFolders(listedFolders);
    await registerCustomMailFolders(mailboxFolders);
    const folders = resolveSyncFolders(listedFolders);
    const importSince = state.initialImportSince ?? getImportSince();
    const mailboxAddress = getMailRuntimeConfig().auth.user.toLowerCase();
    const directionRepair = await repairInboxMailDirections();
    const threadRepair = await repairSelfAddressedInboxThreads(mailboxAddress);
    const updatedCount = directionRepair.updatedCount + threadRepair.updatedCount;
    const results = [];
    for (const folder of folders) {
      results.push(await syncMailFolder(client, folder, importSince, mailboxAddress));
    }
    const inboundIds = [...new Set([
      ...directionRepair.inboundIds,
      ...threadRepair.inboundIds,
      ...results.flatMap((result) => result.inboundIds),
    ])];
    const initialImportDone = results.every((result) => result.complete);
    let suggestionCount = 0;
    if ((state.initialImportDone || initialImportDone) && configuration.openAiReady) {
      const safetyId = getMailSafetyIdentifier(actorId || "shared-mail-sync");
      for (const id of inboundIds.slice(0, MAIL_SUGGESTION_BATCH_SIZE)) {
        try {
          const generated = await generateAndStoreMailSuggestion(id, safetyId, actorId);
          await considerMailAutomation(id, generated.embedding);
          suggestionCount += 1;
        } catch {
          // The failed suggestion stores its own retryable error.
        }
      }
      await embedHistoricalSentMail();
    }
    const importedCount = results.reduce((sum, result) => sum + result.imported, 0);
    const skippedCount = results.reduce((sum, result) => sum + result.skipped, 0);
    await db.$transaction([
      db.mailSyncRun.update({
        where: { id: run.id },
        data: {
          status: initialImportDone ? "SUCCEEDED" : "PARTIAL",
          importedCount,
          updatedCount,
          skippedCount,
          suggestionCount,
          finishedAt: new Date(),
        },
      }),
      db.mailSyncState.update({
        where: { id: "shared" },
        data: {
          initialImportDone,
          lastSuccessAt: new Date(),
          lastError: null,
          leaseToken: null,
          leaseUntil: null,
        },
      }),
    ]);
    await recordMailAudit({
      actorId,
      action: "sync.completed",
      entityType: "MailSyncRun",
      entityId: run.id,
      metadata: {
        source,
        importedCount,
        updatedCount,
        skippedCount,
        suggestionCount,
        initialImportDone,
      },
    });
    return {
      skipped: false,
      importedCount,
      updatedCount,
      skippedCount,
      suggestionCount,
      initialImportDone,
    } as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await db.$transaction([
      db.mailSyncRun.update({
        where: { id: run.id },
        data: { status: "FAILED", error: message, finishedAt: new Date() },
      }),
      db.mailSyncState.update({
        where: { id: "shared" },
        data: { lastError: message, leaseToken: null, leaseUntil: null },
      }),
    ]);
    throw error;
  } finally {
    await client.logout().catch(() => undefined);
  }
};
