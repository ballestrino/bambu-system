"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEditBudgetForm } from "./hooks/useEditBudgetForm";
import { BudgetSlugSection } from "./BudgetSlugSection";
import { BudgetDetailsSection } from "./BudgetDetailsSection";
import { BudgetCostsSection } from "./BudgetCostsSection";
import { BudgetContributionsSection } from "./BudgetContributionsSection";
import { BudgetFormValues } from "@/schemas/BudgetSchema";
import { ExistingBudget } from "@/components/budgets/interfaces/edit-buget"

interface EditBudgetFormProps {
    budget: ExistingBudget;
}

export const EditBudgetForm = ({ budget }: EditBudgetFormProps) => {
    const {
        form,
        values,
        slug,
        setSlug,
        activeSection,
        toggleSection,
        onSubmit,
        isPending
    } = useEditBudgetForm(budget);

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-6">

                <BudgetSlugSection
                    isOpen={activeSection === "slug"}
                    onToggle={() => toggleSection("slug")}
                    slug={slug}
                    onSlugChange={setSlug}
                />

                <BudgetDetailsSection
                    isOpen={activeSection === "details"}
                    onToggle={() => toggleSection("details")}
                    values={values as BudgetFormValues}
                />

                <BudgetCostsSection
                    isOpen={activeSection === "costs"}
                    onToggle={() => toggleSection("costs")}
                    values={values as BudgetFormValues}
                />

                <BudgetContributionsSection
                    isOpen={activeSection === "contributions"}
                    onToggle={() => toggleSection("contributions")}
                    values={values as BudgetFormValues}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Form>
    );
};
