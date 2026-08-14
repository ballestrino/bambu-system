import { AlertTriangle, Archive, Inbox, MailPlus, Search, Send } from "lucide-react";
import Link from "next/link";

import { MailComposeDialog } from "@/components/mail/mail-compose-dialog";
import { MailFolderNav } from "@/components/mail/mail-folder-nav";
import { MailSettingsPanel } from "@/components/mail/mail-settings-panel";
import { MailSyncButton } from "@/components/mail/mail-sync-button";
import { MailThreadDetailPanel } from "@/components/mail/mail-thread-detail";
import { MailThreadList } from "@/components/mail/mail-thread-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OpsPageHeader, OpsPageShell, OpsSection } from "@/components/ops/shared/ops-page-shell";
import type { getMailWorkspace, MailboxView } from "@/data/mail-workspace";
import { cn } from "@/lib/utils";

type Workspace = Awaited<ReturnType<typeof getMailWorkspace>>;

const views = [
  { key: "inbox", label: "Recibidos", icon: Inbox },
  { key: "sent", label: "Enviados", icon: Send },
  { key: "archive", label: "Archivo", icon: Archive },
] as const;

export function MailWorkspace({
  data,
  view,
  query,
  folderKey,
}: {
  data: Workspace;
  view: MailboxView;
  query?: string;
  folderKey?: string;
}) {
  if (!data.schemaReady) {
    return (
      <OpsPageShell>
        <OpsPageHeader title="Correo" eyebrow="Comunicaciones" description="Bandeja compartida con respuestas sugeridas y memoria aprobada." />
        <OpsSection>
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-medium">Módulo pendiente de migración</p>
              <p className="mt-1 text-sm text-muted-foreground">{data.error}</p>
            </div>
          </div>
        </OpsSection>
      </OpsPageShell>
    );
  }
  const baseQuery = new URLSearchParams({ view });
  if (query) baseQuery.set("q", query);
  if (folderKey) baseQuery.set("folder", folderKey);
  const configurationReady = data.configuration.mailReady;
  const customFolders = data.mailFolders.filter(({ key }) => key.startsWith("CUSTOM:"));
  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Comunicaciones"
        title="Correo compartido"
        description="Leé, respondé y aprobá automatizaciones seguras sin salir de Bambú."
        actions={
          <>
            <MailSyncButton disabled={!configurationReady} />
            <MailComposeDialog trigger={<Button><MailPlus /> Nuevo correo</Button>} />
          </>
        }
      />
      {!configurationReady ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Falta configurar el buzón Hostinger: {data.configuration.missingMail.join(", ")}.
          La interfaz queda disponible sin intentar conexiones externas.
        </div>
      ) : null}
      <OpsSection className="p-3 md:p-4">
        <div className="grid gap-4 xl:grid-cols-[21rem_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3 border-b pb-4 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-4">
            <nav className="grid grid-cols-3 gap-2">
              {views.map((item) => (
                <Button key={item.key} variant={view === item.key ? "default" : "outline"} size="sm" asChild>
                  <Link href={`/dashboard/email?view=${item.key}`}><item.icon /> {item.label}</Link>
                </Button>
              ))}
            </nav>
            {customFolders.length ? (
              <MailFolderNav
                folders={customFolders}
                currentFolderKey={view === "folder" ? folderKey : undefined}
              />
            ) : null}
            <form className="relative" action="/dashboard/email">
              <input type="hidden" name="view" value={view} />
              {folderKey ? <input type="hidden" name="folder" value={folderKey} /> : null}
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input name="q" defaultValue={query} placeholder="Buscar asunto, remitente o texto" className="pl-9" />
            </form>
            <MailThreadList
              threads={data.threads}
              selectedId={data.selectedThread?.id}
              baseQuery={baseQuery.toString()}
              view={view}
              folderKey={folderKey}
              folders={data.mailFolders}
            />
          </aside>
          <MailThreadDetailPanel
            thread={data.selectedThread}
            mailboxAddress={data.mailboxAddress}
            moveFolders={data.mailFolders}
          />
        </div>
      </OpsSection>
      <OpsSection
        title="Agente y memoria"
        description="Reglas confirmadas, memoria revisable y control maestro del envío automático."
        actions={
          <div className={cn("text-xs", data.configuration.openAiReady ? "text-[#53985E]" : "text-amber-600")}>
            OpenAI {data.configuration.openAiReady ? "configurado" : "sin configurar"}
          </div>
        }
      >
        <MailSettingsPanel
          autoSendEnabled={data.settings.autoSendEnabled}
          memories={data.memories}
          rules={data.rules}
          queueCount={data.queueCount}
        />
      </OpsSection>
    </OpsPageShell>
  );
}
