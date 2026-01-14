import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { AIButton } from "./ai-button";

interface HeaderProps {
    onSave: () => void;
    isPending: boolean;
    onGenerateAI: () => void;
}

export default function Header({ onSave, isPending, onGenerateAI }: HeaderProps) {
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                <p className="text-muted-foreground">
                    Crear y gestionar estimaciones de presupuesto.
                </p>
            </div>
            <div className="flex sticky items-center gap-2">
                <Button
                    variant="outline"
                    onClick={onSave}
                    disabled={isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Guardando..." : "Guardar Presupuesto"}
                </Button>
                <AIButton onGenerate={onGenerateAI} />
            </div>
        </div>
    )
}
