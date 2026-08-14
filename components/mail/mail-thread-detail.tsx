import { ExternalLink, Forward, Reply, ReplyAll } from "lucide-react";

import { MailComposeDialog } from "@/components/mail/mail-compose-dialog";
import { MailSuggestionCard } from "@/components/mail/mail-suggestion-card";
import { MailThreadActions } from "@/components/mail/mail-thread-actions";
import type { MailThreadDetail } from "@/components/mail/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMailReplyAddress } from "@/lib/mail-agent/reply-address";
import { cn } from "@/lib/utils";

const formatter = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
  timeStyle: "short",
});

const quotedForward = (message: MailThreadDetail["messages"][number]) =>
  `\n\n---------- Mensaje reenviado ----------\nDe: ${message.fromName || message.fromAddress}\nAsunto: ${message.subject}\n\n${message.bodyText}`;

export function MailThreadDetailPanel({
  thread,
  mailboxAddress,
  moveFolders,
}: {
  thread: MailThreadDetail | null;
  mailboxAddress?: string;
  moveFolders: Array<{ key: string; label: string }>;
}) {
  if (!thread) {
    return (
      <div className="min-w-0 flex min-h-[55vh] items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Elegí una conversación para leerla y responder.
      </div>
    );
  }
  const last = thread.messages.at(-1);
  const lastInbound = [...thread.messages].reverse().find((message) => message.direction === "INBOUND");
  const lastReplyAddress = lastInbound
    ? getMailReplyAddress(lastInbound, mailboxAddress)
    : undefined;
  const replyAll = lastInbound
    ? [...new Set([lastReplyAddress, ...lastInbound.toAddresses, ...lastInbound.ccAddresses])]
        .filter((address): address is string => Boolean(address))
        .filter((address) => address.toLowerCase() !== mailboxAddress?.toLowerCase())
    : [];
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{thread.subject}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {thread.participantEmails.join(" · ")}
          </p>
        </div>
        <MailThreadActions
          threadId={thread.id}
          unread={thread.unreadCount > 0}
          archived={thread.isArchived}
          currentFolderKey={lastInbound?.folderKey}
          folders={moveFolders}
        />
      </div>
      <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
        {thread.messages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "rounded-lg border p-4",
              message.direction === "OUTBOUND" && "ml-4 border-[#53985E]/30 bg-[#F7FBF7] dark:bg-[#20291D] md:ml-10"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {message.fromName || message.fromAddress}
                </p>
                <p className="text-xs text-muted-foreground">Para: {message.toAddresses.join(", ")}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatter.format(message.receivedAt ?? message.sentAt ?? message.createdAt)}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{message.bodyText}</p>
            {message.attachments.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.attachments.map((attachment) =>
                  attachment.providerPartId && !message.requiresHandoff ? (
                    <Badge key={attachment.id} variant="outline" asChild>
                      <a href={`/api/mail/attachments/${attachment.id}`}>
                        {attachment.filename} · {Math.ceil(attachment.sizeBytes / 1024)} KB
                      </a>
                    </Badge>
                  ) : (
                    <Badge key={attachment.id} variant="outline">
                      {attachment.filename} · {Math.ceil(attachment.sizeBytes / 1024)} KB
                    </Badge>
                  )
                )}
              </div>
            ) : null}
            {message.requiresHandoff ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <ExternalLink className="size-3" /> Abrí este mensaje en Hostinger para ver el contenido completo.
              </p>
            ) : null}
            {message.direction === "INBOUND" && !message.hasAttachments && !message.requiresHandoff ? (
              <div className="mt-4">
                <MailSuggestionCard
                  messageId={message.id}
                  threadId={thread.id}
                  replyAddress={getMailReplyAddress(message, mailboxAddress)}
                  fallbackSubject={message.subject}
                  suggestion={message.suggestion}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {last ? (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {lastInbound && lastReplyAddress ? (
            <MailComposeDialog
              trigger={<Button><Reply /> Responder</Button>}
              title="Responder"
              threadId={thread.id}
              inReplyToId={lastInbound.id}
              initialTo={lastReplyAddress}
              initialSubject={`Re: ${thread.subject}`}
            />
          ) : null}
          {lastInbound && replyAll.length > 1 ? (
            <MailComposeDialog
              trigger={<Button variant="outline"><ReplyAll /> Responder a todos</Button>}
              title="Responder a todos"
              threadId={thread.id}
              inReplyToId={lastInbound.id}
              initialTo={replyAll.join(", ")}
              initialSubject={`Re: ${thread.subject}`}
            />
          ) : null}
          <MailComposeDialog
            trigger={<Button variant="outline"><Forward /> Reenviar</Button>}
            title="Reenviar"
            initialSubject={`Fwd: ${thread.subject}`}
            initialBody={quotedForward(last)}
          />
        </div>
      ) : null}
    </div>
  );
}
