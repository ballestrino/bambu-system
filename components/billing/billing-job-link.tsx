"use client";

import { Briefcase, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

import { BillingChip } from "@/components/billing/billing-chip";
import { useReceiverJob } from "@/components/billing/hooks/use-receiver-job";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DraftRow } from "@/lib/billing/billing-month-view";

type JobChoice = { id: string; name: string };

const linkButton =
  "inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted disabled:opacity-60";

// El trabajo de Bambú del receptor (feature 43): vinculado, con sus avisos
// (precio distinto, visitas canceladas, trabajo pausado), o la sugerencia
// "¿Es …? Vincular". Vincular lo confirma una persona; el agente solo sugiere.
export const BillingJobLink = ({ choices, periodKey, row }: { choices: JobChoice[]; periodKey: string; row: DraftRow }) => {
  const link = row.jobLink;
  const mutation = useReceiverJob(periodKey, row.id);
  const [open, setOpen] = useState(false);
  if (!link?.receiverKey) return null;
  const choose = (jobId: string | null) => {
    setOpen(false);
    mutation.mutate(jobId);
  };

  const picker = (label: React.ReactNode, aria: string) => (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger aria-label={aria} className={linkButton} disabled={mutation.isPending}>
        {label}
        <ChevronDown aria-hidden className="size-3" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Buscar trabajo" />
          <CommandList>
            <CommandEmpty>No hay trabajos con ese nombre.</CommandEmpty>
            <CommandGroup>
              {choices.map((job) => (
                <CommandItem key={job.id} onSelect={() => choose(job.id)} value={`${job.name} ${job.id}`}>
                  {job.name}
                </CommandItem>
              ))}
              {link.job ? (
                <CommandItem className="text-red-700 dark:text-red-300" onSelect={() => choose(null)} value="quitar vínculo">
                  Quitar el vínculo
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ops-text-muted">
      {mutation.isPending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Briefcase aria-hidden className="size-3.5" />}
      {link.job ? (
        <>
          {picker(link.job.name, `Cambiar el trabajo de ${row.name}`)}
          {row.status === "DRAFT"
            ? link.warnings.map((warning) => (
                <BillingChip key={warning.kind} tone="warning">{warning.label}</BillingChip>
              ))
            : null}
        </>
      ) : link.suggestion ? (
        <>
          <span>¿Es {link.suggestion.name}?</span>
          <button className={linkButton} disabled={mutation.isPending} onClick={() => choose(link.suggestion!.id)} type="button">
            Vincular
          </button>
          {choices.length ? picker("Otro", `Elegir otro trabajo para ${row.name}`) : null}
        </>
      ) : choices.length ? (
        picker("Vincular trabajo", `Vincular un trabajo a ${row.name}`)
      ) : null}
    </div>
  );
};
