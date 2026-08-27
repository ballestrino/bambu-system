import { db } from "@/lib/db";
import { getMailConfigurationStatus } from "@/lib/mail-agent/config";
import { sortMailMessages } from "@/lib/mail-agent/message-date";
import { requireAdminSession } from "@/lib/require-admin-session";

export type MailboxView = "inbox" | "sent" | "archive" | "folder";

type WorkspaceInput = {
  view: MailboxView;
  query?: string;
  threadId?: string;
  folderKey?: string;
};

const suggestionWithSources = {
  include: {
    revisions: {
      orderBy: { revision: "desc" as const },
      include: {
        sources: {
          include: {
            officialBudgetOption: true,
            officialBudgetVersion: {
              include: {
                officialBudget: {
                  select: {
                    id: true,
                    sourceBudgetId: true,
                    sourceBudgetName: true,
                    sourceBudgetSlug: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

const getViewWhere = (view: MailboxView, folderKey?: string) => {
  if (view === "folder" && folderKey) {
    return { messages: { some: { direction: "INBOUND" as const, folderKey } } };
  }
  if (view === "archive") return { isArchived: true };
  if (view === "sent") {
    return { messages: { some: { direction: "OUTBOUND" as const, state: "SENT" as const } } };
  }
  return {
    messages: { some: { direction: "INBOUND" as const, folderKey: "INBOX" } },
  };
};

const isMissingMailSchema = (error: unknown) =>
  error instanceof Error &&
  (/Mail(?:Thread|Settings|Message)/.test(error.message) || error.message.includes("P2021"));

export const getMailWorkspace = async (input: WorkspaceInput) => {
  await requireAdminSession();
  const configuration = getMailConfigurationStatus();
  if (!db.mailThread) {
    return {
      schemaReady: false as const,
      configuration,
      error:
        "El cliente de Prisma necesita regenerarse después de reiniciar el servidor de desarrollo.",
    };
  }
  try {
    const query = input.query?.trim();
    const where = {
      ...getViewWhere(input.view, input.folderKey),
      ...(query
        ? {
            OR: [
              { subject: { contains: query, mode: "insensitive" as const } },
              { messages: { some: { fromAddress: { contains: query, mode: "insensitive" as const } } } },
              { messages: { some: { bodyText: { contains: query, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };
    const [
      threads,
      selectedThread,
      settings,
      syncState,
      lastRun,
      memories,
      rules,
      queueCount,
      folderCursors,
    ] =
      await Promise.all([
        db.mailThread.findMany({
          where,
          orderBy: { lastMessageAt: "desc" },
          take: 50,
          include: {
            messages: {
              include: { suggestion: true },
            },
          },
        }),
        input.threadId
          ? db.mailThread.findUnique({
              where: { id: input.threadId },
              include: {
                messages: {
                  include: {
                    attachments: true,
                    suggestion: suggestionWithSources,
                  },
                },
              },
            })
          : null,
        db.mailSettings.upsert({
          where: { id: "shared" },
          create: { id: "shared" },
          update: {},
        }),
        db.mailSyncState.findUnique({ where: { id: "shared" } }),
        db.mailSyncRun.findFirst({ orderBy: { startedAt: "desc" } }),
        db.mailMemory.findMany({
          where: { status: { in: ["PENDING", "APPROVED"] } },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        db.mailAutoReplyRule.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
        db.mailAutoReplyQueue.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
        db.mailFolderCursor.findMany({
          where: {
            OR: [
              { folderKey: "ARCHIVE" },
              { folderKey: { startsWith: "CUSTOM:" } },
            ],
          },
          orderBy: { displayName: "asc" },
          select: { folderKey: true, displayName: true },
        }),
      ]);
    return {
      schemaReady: true as const,
      configuration,
      mailboxAddress:
        process.env.HOSTINGER_MAIL_FROM || process.env.HOSTINGER_MAIL_USER || "",
      mailFolders: [
        { key: "INBOX", label: "Recibidos" },
        ...(!folderCursors.some(({ folderKey }) => folderKey === "ARCHIVE")
          ? [{ key: "ARCHIVE", label: "Archivo" }]
          : []),
        ...folderCursors.map(({ folderKey, displayName }) => ({
          key: folderKey,
          label: displayName,
        })),
      ],
      threads: threads.map((thread) => {
        const sortedMessages = sortMailMessages(thread.messages, "desc");
        const inbound = sortedMessages.find(({ direction }) => direction === "INBOUND");
        const currentFolderKey = input.view === "inbox"
          ? "INBOX"
          : input.view === "archive"
            ? "ARCHIVE"
            : input.view === "folder"
              ? input.folderKey
              : inbound?.folderKey;
        return {
          ...thread,
          canMove: Boolean(inbound),
          currentFolderKey,
          messages: sortedMessages.slice(0, 1),
        };
      }),
      selectedThread: selectedThread
        ? { ...selectedThread, messages: sortMailMessages(selectedThread.messages, "asc") }
        : null,
      settings,
      syncState,
      lastRun,
      memories,
      rules,
      queueCount,
    };
  } catch (error) {
    if (!isMissingMailSchema(error)) throw error;
    return {
      schemaReady: false as const,
      configuration,
      error: "La migración del módulo de correo todavía no está aplicada en esta base.",
    };
  }
};
