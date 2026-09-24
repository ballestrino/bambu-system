"use client";

import { CalendarPlus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { OccurrenceGenerationSummary } from "@/components/ops/occurrences/occurrence-generation-summary";
import { OccurrenceReplacementList } from "@/components/ops/occurrences/occurrence-replacement-list";
import { useReplacementSelection } from "@/components/ops/occurrences/use-replacement-selection";
import {
  useGenerateOccurrences,
  useOccurrenceGenerationPreview,
} from "@/components/ops/hooks/useOccurrenceGeneration";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OccurrenceGenerationPreset } from "@/lib/ops/occurrence-generation-presets";
import { cn } from "@/lib/utils";
import {
  getOccurrenceGenerationDays,
  MAX_OCCURRENCE_GENERATION_DAYS,
} from "@/schemas/ops/occurrence-generation";

type DateRange = { endDate: string; startDate: string };

// Only the dates travel: the preset label is UI.
const toRange = ({ endDate, startDate }: DateRange): DateRange => ({ endDate, startDate });

const getRangeError = ({ endDate, startDate }: DateRange) => {
  if (!startDate || !endDate) return "Elegí las dos fechas.";
  if (endDate < startDate) return "La fecha final tiene que ser igual o posterior a la inicial.";
  if (getOccurrenceGenerationDays(startDate, endDate) > MAX_OCCURRENCE_GENERATION_DAYS) {
    return `El rango puede tener hasta ${MAX_OCCURRENCE_GENERATION_DAYS} días.`;
  }
  return null;
};

// Generates by hand the visits the active rules have in a range (feature 9).
// The first preset is the default; the dates can always be edited.
export const GenerateOccurrencesDialog = ({
  jobId,
  presets,
  scheduleRuleId,
  scopeLabel,
  trigger,
  triggerLabel = "Generar visitas",
}: {
  jobId?: string;
  presets: OccurrenceGenerationPreset[];
  scheduleRuleId?: string;
  scopeLabel: string;
  trigger?: ReactNode;
  triggerLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(() => toRange(presets[0]));
  const rangeError = getRangeError(range);
  const input = { ...range, jobId, scheduleRuleId };
  const preview = useOccurrenceGenerationPreview(input, open && !rangeError);
  const generate = useGenerateOccurrences();
  const selection = useReplacementSelection(preview.data);
  const hasWork = selection.createCount > 0 || selection.deleteCount > 0;

  // A new range brings a new list: nothing picked again.
  const changeRange = (next: DateRange) => {
    setRange(next);
    selection.reset();
  };

  // Every opening starts from the current context (another week, another day).
  const onOpenChange = (nextOpen: boolean) => {
    if (nextOpen) changeRange(toRange(presets[0]));
    setOpen(nextOpen);
  };

  // The hook shows the toast (success or error); the dialog closes on success.
  const submit = async () => {
    try {
      await generate.mutateAsync({ ...input, replaceIds: selection.replaceIds });
      setOpen(false);
    } catch {
      // Already reported by the hook.
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" type="button" variant="outline">
            <CalendarPlus aria-hidden className="h-4 w-4" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar visitas</DialogTitle>
          <DialogDescription>
            Crea las visitas que faltan de {scopeLabel} en el rango. Las que ya existen no se tocan.
          </DialogDescription>
        </DialogHeader>

        {presets.length > 1 ? (
          <div aria-label="Rangos sugeridos" className="flex flex-wrap gap-2" role="group">
            {presets.map((preset) => {
              const active =
                preset.startDate === range.startDate && preset.endDate === range.endDate;
              return (
                <Button
                  aria-pressed={active}
                  className={cn(active && "border-primary")}
                  key={preset.label}
                  onClick={() => changeRange(toRange(preset))}
                  size="sm"
                  type="button"
                  variant={active ? "secondary" : "outline"}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="generate-start">Desde</Label>
            <Input
              id="generate-start"
              onChange={(event) => changeRange({ ...range, startDate: event.target.value })}
              type="date"
              value={range.startDate}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="generate-end">Hasta</Label>
            <Input
              id="generate-end"
              onChange={(event) => changeRange({ ...range, endDate: event.target.value })}
              type="date"
              value={range.endDate}
            />
          </div>
        </div>

        <OccurrenceGenerationSummary
          error={preview.error}
          isLoading={preview.isFetching}
          preview={preview.data}
          rangeError={rangeError}
        />

        {preview.data && !preview.isFetching && !rangeError ? (
          <OccurrenceReplacementList
            kept={preview.data.kept}
            onToggle={selection.toggle}
            onToggleAll={selection.toggleAll}
            onToggleReason={selection.toggleReason}
            replaceable={preview.data.replaceable}
            selected={selection.selected}
          />
        ) : null}

        <DialogFooter className="gap-2">
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={Boolean(rangeError) || !hasWork || preview.isFetching || generate.isPending}
            onClick={submit}
            type="button"
          >
            {generate.isPending ? "Generando..." : selection.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
