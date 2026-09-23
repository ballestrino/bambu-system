import { Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

import { AgentMarkdown } from "@/components/agent/agent-markdown";
import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { AgentCopyMenu } from "@/components/agent/cards/agent-copy-menu";
import { formatMoney } from "@/components/agent/format";
import type { EmailCardData } from "@/components/agent/types";
import { getOfficialBudgetUrl } from "@/lib/agent/proposals";

// Borrador de correo o WhatsApp ya validado: cada importe tiene fuente en la
// conversación y la nota de Literal E está. No se envía nada desde acá.
export function AgentEmailCard({ data }: { data: EmailCardData }) {
  const whatsapp = data.channel === "whatsapp";
  return (
    <AgentCard
      icon={whatsapp ? MessageCircle : Mail}
      title={whatsapp ? "Mensaje de WhatsApp" : data.subject || "Correo"}
      subtitle={data.to ? `Para: ${data.to}` : whatsapp ? null : "Correo sin destinatario"}
      aside={<AgentCopyMenu content={data.body} subject={whatsapp ? null : data.subject} />}
    >
      {!whatsapp && data.subject && (
        <p className="text-xs">
          <span className="text-muted-foreground">Asunto: </span>
          {data.subject}
        </p>
      )}
      <div className="rounded-md bg-muted/40 p-2">
        <AgentMarkdown content={data.body} />
      </div>
      {data.sources.length > 0 && (
        <CardNote>
          Fuentes:{" "}
          {data.sources.map((source, index) => (
            <span key={`${source.officialBudgetId}-${source.hasProducts}`}>
              {index > 0 && " · "}
              <Link
                href={getOfficialBudgetUrl(source.officialBudgetId)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {source.name} v{source.version}
              </Link>
              {source.hasProducts ? " (con productos)" : " (sin productos)"}
            </span>
          ))}
        </CardNote>
      )}
      {data.groundedAmounts.length > 0 && (
        <CardNote>Importes con fuente: {data.groundedAmounts.map(formatMoney).join(" · ")}</CardNote>
      )}
    </AgentCard>
  );
}
