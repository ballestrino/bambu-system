import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { AIButton } from "@/components/budgets/create-budget/AiButton";
import { AIChat } from "@/components/ai/AIChat";

interface HeaderProps {
    onSave: () => void;
    isPending: boolean;
    onGenerateAI: () => void;
    form: any
}

export default function Header({ onSave, isPending, onGenerateAI, form }: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
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
                <AIChat
                    trigger={<AIButton onGenerate={onGenerateAI} />}
                    contextData={form.watch()}
                />
            </div>
        </div>
    )
}
