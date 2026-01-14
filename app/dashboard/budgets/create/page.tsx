"use client";

import { FormProvider } from "react-hook-form";
import { BudgetForm } from "@/components/budgets/create-budget/CreateBudgetForm";
import { BudgetPreview } from "@/components/budgets/create-budget/BudgetPreview";
import Header from "@/components/budgets/create-budget/Header";
import useCreateBudgetForm from "@/components/budgets/create-budget/hooks/useCreateBudgetForm";

export default function CreateBudgetPage() {
    const { form, onSubmit, handleGenerateAI, isPending } = useCreateBudgetForm();

    return (
        <FormProvider {...form}>
            <div className="w-full pb-10 h-full items-center justify-center flex ">

                <div className="flex flex-col container h-full space-y-6">
                    <div className="flex items-center justify-between">
                        <Header
                            onSave={form.handleSubmit(onSubmit)}
                            isPending={isPending}
                            onGenerateAI={handleGenerateAI}
                        />

                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7">
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <BudgetForm />
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
