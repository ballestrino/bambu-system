import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { AIButton } from "@/components/budgets/create-budget/AiButton";
import { AgentSheetHost } from "@/components/agent/agent-sheet-host";
import type { UseFormReturn } from "react-hook-form";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

interface HeaderProps {
    onSave: () => void;
    isPending: boolean;
    form: UseFormReturn<BudgetFormValues>
}

export default function Header({ onSave, isPending, form }: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">Generador de presupuestos</h1>
                <p className="text-muted-foreground">
                    Crear y gestionar estimaciones de presupuesto.
                </p>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
                <Button
                    variant="outline"
                    onClick={onSave}
                    disabled={isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Guardando..." : "Guardar Presupuesto"}
                </Button>
                {/* El agente lee el formulario al enviar cada mensaje: sin
                    re-render por tecla y siempre con los valores del momento. */}
                <AgentSheetHost trigger={<AIButton />} getFormValues={() => form.getValues()} />
            </div>
        </div>
    )
}
