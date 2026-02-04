"use client";

import { FormProvider } from "react-hook-form";
import { EditBudgetForm } from "@/components/budgets/edit-budget/EditBudgetForm";
import EditBudgetHeader from "@/components/budgets/edit-budget/EditBudgetHeader";
import { useEditBudgetForm } from "@/components/budgets/edit-budget/hooks/useEditBudgetForm";
import { ExistingBudget } from "@/components/budgets/interfaces/edit-buget";
import { BudgetPreview } from "@/components/budgets/create-budget/BudgetPreview";
import { BudgetFormValues } from "@/schemas/BudgetSchema";

interface EditBudgetPageClientProps {
    budget: ExistingBudget;
}

export default function EditBudgetPageClient({ budget }: EditBudgetPageClientProps) {
    const {
        form,
        values,
        slug,
        setSlug,
        activeSection,
        toggleSection,
        onSubmit,
        isPending,
        handleGenerateAI
    } = useEditBudgetForm(budget);

    return (
        <FormProvider {...form}>
            <div className="w-full pb-10 px-4 h-full items-center justify-center flex ">
                <div className="flex flex-col container h-full space-y-6">
                    <div className="flex items-center justify-between">
                        <EditBudgetHeader
                            onSave={onSubmit}
                            isPending={isPending}
                            onGenerateAI={handleGenerateAI}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7">
                            <form onSubmit={onSubmit}>
                                <EditBudgetForm
                                    slug={slug}
                                    setSlug={setSlug}
                                    activeSection={activeSection}
                                    toggleSection={toggleSection}
                                    values={values as BudgetFormValues}
                                />
                            </form>
                        </div>
                        <div className="lg:col-span-5">
                            <div className="sticky top-32">
                                <BudgetPreview />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormProvider>
    );
}
