"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";

import { BudgetFieldError } from "@/components/agent/actions/agent-writes.action";
import { AgentBudgetDetail } from "@/components/agent/budget-editor/agent-budget-detail";
import { AgentBudgetFooter, type BudgetEditorStatus } from "@/components/agent/budget-editor/agent-budget-footer";
import type { BudgetEditor, BudgetEditorTab, BudgetEditorTarget } from "@/components/agent/budget-editor/use-budget-editor";
import { useAgentBudgetSave } from "@/components/agent/hooks/use-agent-budget-save";
import { CreateBudgetForm } from "@/components/budgets/create-budget/CreateBudgetForm";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isBudgetLocked } from "@/lib/agent/budget-draft";
import type { AgentProposalDto } from "@/lib/agent/proposals";
import { agentBudgetEditorSchema } from "@/schemas/agent-proposals";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

const SOURCE_LABELS: Record<BudgetEditorTarget["source"], string> = {
  calculation: "Cálculo del agente",
  proposal: "Propuesta del agente: guardar la confirma con estos valores",
};

const describeStatus = (status: BudgetEditorStatus) =>
  status.kind === "saved" ? "guardado en el generador" : status.kind === "executing" ? "guardándose" : "sin guardar";

function EditorForm({
  target,
  editor,
  conversationId,
  proposal,
}: {
  target: BudgetEditorTarget;
  editor: BudgetEditor;
  conversationId: string;
  proposal: AgentProposalDto | undefined;
}) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(agentBudgetEditorSchema) as unknown as Resolver<BudgetFormValues>,
    defaultValues: target.values,
    mode: "onChange",
  });
  const name = useWatch({ control: form.control, name: "name" });
  const save = useAgentBudgetSave(conversationId);
  const [error, setError] = useState<string | null>(null);

  // Cada cambio queda como borrador en una ref del editor: sin re-render.
  const onChange = useEffectEvent((values: BudgetFormValues) => editor.recordDraft(target.toolCallId, values));
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true, isDirty: true },
        callback: ({ values, isDirty }) => {
          if (isDirty) onChange(values as BudgetFormValues);
        },
      }),
    [form]
  );

  const status: BudgetEditorStatus =
    proposal?.status === "CONFIRMED"
      ? { kind: "saved", result: proposal.result }
      : proposal?.status === "EXECUTING"
        ? { kind: "executing" }
        : { kind: "editable" };
  const locked = isBudgetLocked(proposal?.status);

  // Un error del nombre (vacío o con la dirección tomada) se marca en el
  // campo, en la pestaña Editar; el resto, arriba del botón.
  const handleSave = form.handleSubmit(
    (values) => {
      setError(null);
      save.mutate(
        { conversationId, toolCallId: target.toolCallId, values },
        {
          onSuccess: () => editor.dropDraft(target.toolCallId),
          onError: (failure) => {
            if (failure instanceof BudgetFieldError) {
              form.setError(failure.field, { message: failure.message });
              editor.setTab("edit");
            } else {
              setError(failure.message);
            }
          },
        }
      );
    },
    () => editor.setTab("edit")
  );

  return (
    <FormProvider {...form}>
      <SheetHeader className="flex-row items-start gap-2 border-b px-4 py-3 text-left">
        <div className="min-w-0 flex-1 space-y-1">
          <SheetTitle className="truncate">{name?.trim() || target.title}</SheetTitle>
          <SheetDescription>
            {SOURCE_LABELS[target.source]} · {describeStatus(status)}
          </SheetDescription>
        </div>
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-11 shrink-0 sm:size-9" aria-label="Cerrar el editor">
            <X aria-hidden />
          </Button>
        </SheetClose>
      </SheetHeader>
      <Tabs
        value={locked ? "detail" : editor.tab}
        onValueChange={(value) => editor.setTab(value as BudgetEditorTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="border-b px-4 py-2">
          <TabsList className="h-auto w-full sm:h-9 sm:w-fit">
            <TabsTrigger value="detail" className="h-11 sm:h-[calc(100%-1px)]">
              Detalle
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={locked} className="h-11 sm:h-[calc(100%-1px)]">
              Editar
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="detail" className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
          <AgentBudgetDetail />
        </TabsContent>
        <TabsContent value="edit" className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          {target.basedOn && (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Se guarda como un presupuesto nuevo: “{target.basedOn}” no cambia. Para guardar cambios en
              ese, pedíselo al agente.
            </p>
          )}
          <form onSubmit={handleSave}>
            <CreateBudgetForm />
          </form>
        </TabsContent>
      </Tabs>
      <AgentBudgetFooter status={status} saving={save.isPending} error={error} onSave={handleSave} />
    </FormProvider>
  );
}

// El editor de un presupuesto que armó el agente, encima del chat (y del
// Sheet de Presupuestos): el detalle de la página del presupuesto y el
// formulario del generador sobre los mismos valores, y Guardar en el
// generador. Una propuesta guardada o guardándose es de solo lectura.
export function AgentBudgetSheet({
  editor,
  conversationId,
  proposalFor,
}: {
  editor: BudgetEditor;
  conversationId: string;
  proposalFor: (toolCallId: string) => AgentProposalDto | undefined;
}) {
  const { target } = editor;
  return (
    <Sheet open={editor.open} onOpenChange={editor.onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl [&>button]:hidden"
        onCloseAutoFocus={editor.restoreFocus}
      >
        {target && (
          <EditorForm
            key={target.toolCallId}
            target={target}
            editor={editor}
            conversationId={conversationId}
            proposal={proposalFor(target.toolCallId)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
