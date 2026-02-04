import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { AIButton } from "@/components/budgets/create-budget/AiButton";

interface EditBudgetHeaderProps {
    onSave: () => void;
    isPending: boolean;
    onGenerateAI: () => void;
}

export default function EditBudgetHeader({ onSave, isPending, onGenerateAI }: EditBudgetHeaderProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row items-start md:items-center justify-between w-full">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">Editar Presupuesto</h1>
                <p className="text-muted-foreground">
                    Modificar y gestionar el presupuesto existente.
                </p>
            </div>
            <div className="flex flex-col md:flex-row  gap-2">
                <Button
                    variant="outline"
                    onClick={onSave}
                    disabled={isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <AIButton onGenerate={onGenerateAI} />
            </div>
        </div>
    )
}
