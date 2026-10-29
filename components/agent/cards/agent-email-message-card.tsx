import { MailOpen, Paperclip } from "lucide-react";

import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import type { EmailMessageCardData } from "@/components/agent/types";

type Email = EmailMessageCardData["emails"][number];

function EmailItem({ email }: { email: Email }) {
  const recipients = [...email.to, ...email.cc].join(", ");
  return (
    <details className="group py-2 first:pt-0 last:pb-0">
      <summary className="cursor-pointer list-none select-none">
        <p className="text-xs font-medium break-words">
          {email.unread ? "● " : ""}
          {email.subject}
        </p>
        <p className="text-xs break-words text-ops-text-muted">
          {[email.from, email.when, email.mailboxAddress, email.answered ? "Respondido" : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </summary>
      <div className="mt-2 space-y-2 rounded-md bg-muted/40 p-2">
        {recipients && (
          <p className="text-xs break-words">
            <span className="text-ops-text-muted">Para: </span>
            {recipients}
          </p>
        )}
        <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">{email.body}</p>
        {email.bodyTruncated && <CardNote>El correo sigue: el agente leyó el comienzo.</CardNote>}
        {email.attachments.length > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-ops-text-muted">
            <Paperclip className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="break-words">{email.attachments.join(", ")}</span>
          </p>
        )}
      </div>
    </details>
  );
}

// Los correos que abrió el agente (readEmail), tal como los leyó: cada uno se
// despliega con un toque para no llenar el chat. Abrirlos no los marcó como
// leídos.
export function AgentEmailMessageCard({ data }: { data: EmailMessageCardData }) {
  const count = data.emails.length;
  return (
    <AgentCard
      icon={MailOpen}
      title={count === 1 ? data.emails[0].subject : `${count} correos abiertos`}
      subtitle={count === 1 ? null : "Tocá uno para ver el texto"}
    >
      <div className="divide-y">
        {data.emails.map((email) => (
          <EmailItem key={email.ref} email={email} />
        ))}
      </div>
      {data.missing.length > 0 && (
        <CardNote tone="warning">
          {data.missing.length === 1 ? "No se pudo abrir 1 correo" : `No se pudieron abrir ${data.missing.length} correos`}:{" "}
          {data.missing[0].reason}.
        </CardNote>
      )}
    </AgentCard>
  );
}
