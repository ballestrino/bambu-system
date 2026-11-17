"use client";

import { Brain, ScrollText, SlidersHorizontal, UserRound, type LucideIcon } from "lucide-react";

import { AgentInstructionsView } from "@/components/agent/instructions/agent-instructions-view";
import { AgentMemoryView } from "@/components/agent/memory/agent-memory-view";
import { SettingsAccount } from "@/components/settings/dialog/settings-account";
import { SettingsGeneral } from "@/components/settings/dialog/settings-general";
import {
  closeSettings,
  selectSettingsSection,
  useSettingsSection,
  type SettingsSection,
} from "@/components/settings/dialog/settings-url";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SectionItem = { id: SettingsSection; title: string; icon: LucideIcon };

const GENERAL: SectionItem[] = [
  { id: "general", title: "General", icon: SlidersHorizontal },
  { id: "cuenta", title: "Cuenta", icon: UserRound },
];
const AGENT: SectionItem[] = [
  { id: "memoria", title: "Memoria", icon: Brain },
  { id: "instrucciones", title: "Instrucciones", icon: ScrollText },
];
const TITLES = Object.fromEntries([...GENERAL, ...AGENT].map((item) => [item.id, item.title]));

const CONTENT: Record<SettingsSection, () => React.ReactNode> = {
  general: () => <SettingsGeneral />,
  cuenta: () => <SettingsAccount />,
  memoria: () => <AgentMemoryView embedded />,
  instrucciones: () => <AgentInstructionsView embedded />,
};

function SectionButton({ item, current }: { item: SectionItem; current: boolean }) {
  return (
    <button
      type="button"
      aria-current={current ? "page" : undefined}
      onClick={() => selectSettingsSection(item.id)}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2.5 rounded-[9px] px-2.5 text-left text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        current
          ? "bg-ops-bamboo-soft font-semibold text-ops-bamboo-strong"
          : "font-medium text-ops-text hover:bg-ops-surface-muted"
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {item.title}
    </button>
  );
}

// Configuración en un diálogo, como la app de Claude: secciones a la izquierda
// (arriba, deslizables, en el celular) y el contenido a la derecha.
export function SettingsDialog() {
  const section = useSettingsSection();

  return (
    <Dialog open={section !== null} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="flex h-[min(640px,calc(100dvh-1.5rem))] w-[calc(100%-1rem)] max-w-[920px] flex-col gap-0 overflow-hidden rounded-[var(--ops-radius-dialog)] border-ops-border bg-ops-surface p-0 sm:max-w-[920px] md:flex-row">
        <nav
          aria-label="Secciones de configuración"
          className="flex shrink-0 flex-col gap-0.5 border-b border-ops-border bg-ops-canvas/60 p-3 md:w-56 md:border-r md:border-b-0 md:p-4"
        >
          <DialogTitle className="mb-2 px-2.5 text-lg font-semibold tracking-tight md:mb-3">Configuración</DialogTitle>
          <DialogDescription className="sr-only">Tema, cuenta, memoria e instrucciones del agente</DialogDescription>
          <div className="-mx-3 flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0">
            {GENERAL.map((item) => (
              <SectionButton key={item.id} item={item} current={item.id === section} />
            ))}
            <p className="mt-3 mb-1 hidden px-2.5 text-[11px] font-semibold tracking-wider text-ops-text-muted uppercase md:block">
              Agente
            </p>
            {AGENT.map((item) => (
              <SectionButton key={item.id} item={item} current={item.id === section} />
            ))}
          </div>
        </nav>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <h2 className="hidden px-8 pt-5 pb-2 text-xl font-semibold tracking-tight md:block">
            {section ? TITLES[section] : null}
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8 md:px-8 md:pt-2">
            {section ? CONTENT[section]() : null}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
