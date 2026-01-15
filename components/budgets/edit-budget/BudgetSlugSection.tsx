"use client";

import { Input } from "@/components/ui/input";
import { BudgetSection } from "./BudgetSection";

interface BudgetSlugSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    slug: string;
    onSlugChange: (value: string) => void;
}

export const BudgetSlugSection = ({ isOpen, onToggle, slug, onSlugChange }: BudgetSlugSectionProps) => {
    return (
        <BudgetSection
            title="Configuración Avanzada"
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        URL del Presupuesto (Slug)
                    </label>
                    <Input
                        value={slug}
                        onChange={(e) => onSlugChange(e.target.value)}
                        placeholder="mi-presupuesto-ejemplo"
                    />
                    <p className="text-[0.8rem] text-muted-foreground">
                        Cambiar esto modificará el enlace para acceder al presupuesto.
                    </p>
                </div>
            </div>
        </BudgetSection>
    );
};
