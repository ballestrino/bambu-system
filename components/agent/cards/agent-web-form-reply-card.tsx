import { MailCheck } from "lucide-react";

import { AgentMarkdown } from "@/components/agent/agent-markdown";
import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { AgentCopyMenu } from "@/components/agent/cards/agent-copy-menu";
import { formatMoney } from "@/components/agent/format";
import type { AgentToolData } from "@/components/agent/types";

// La respuesta que fillWebFormReply puso en el campo Mensaje de Formularios
// (feature 75). La página la aplica al llegar; no se manda nada desde acá.
export function AgentWebFormReplyCard({ data }: { data: AgentToolData<"fillWebFormReply"> }) {
  return (
    <AgentCard
      icon={MailCheck}
      title={data.subject || "Respuesta del formulario"}
      subtitle={`Para: ${data.name} · ${data.to}`}
      aside={<AgentCopyMenu content={data.body} subject={data.subject} />}
    >
      <div className="rounded-md bg-muted/40 p-2">
        <AgentMarkdown content={data.body} />
      </div>
      <CardNote>Quedó en el campo Mensaje del formulario: revisala y tocá Enviar respuesta.</CardNote>
      {data.groundedAmounts.length > 0 && (
        <CardNote>Importes con fuente: {data.groundedAmounts.map(formatMoney).join(" · ")}</CardNote>
      )}
    </AgentCard>
  );
}
