import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';
import { BudgetSchema, defaultBudgetValues } from '@/schemas/BudgetSchema';
import { createBudget } from '@/actions/budgets/create-budget';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import * as z from 'zod';

export default function useCreateBudgetForm() {
    const router = useRouter();

    const handleGenerateAI = () => {
        // Mock AI generation
        console.log("AI Generation Triggered");
        // Example: fill form with random data
        form.reset({
            ...defaultBudgetValues,
            visits: 4,
            hours_per_visit: 2,
            nominal_hour: 15,
            employees: 2,
            products_price: 100,
            transportation_cost: 50
        })
    };

    const form = useForm({
        resolver: zodResolver(BudgetSchema),
        defaultValues: defaultBudgetValues,
        mode: "onChange", // Enable real-time validation/observation
    });

    const [isPending, startTransition] = React.useTransition();

    const onSubmit = (data: z.infer<typeof BudgetSchema>) => {
        startTransition(() => {
            createBudget(data).then((res) => {
                if (res.error) {
                    toast.error(res.error);
                }
                if (res.success) {
                    toast.success(res.success);
                    router.push("/dashboard/budgets");
                }
            })
        });
    };

    return {
        form,
        isPending,
        onSubmit,
        handleGenerateAI,
    }
}
