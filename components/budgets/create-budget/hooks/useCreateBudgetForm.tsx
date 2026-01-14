import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';
import { BudgetSchema, defaultBudgetValues } from '@/schemas/BudgetSchema';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useCreateBudgetMutation } from '../../hooks/useCreateBudgetMutation';

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

    const { createBudgetAsync, isCreating } = useCreateBudgetMutation();

    const onSubmit = async (data: z.infer<typeof BudgetSchema>) => {
        try {
            await createBudgetAsync(data);
            router.push("/dashboard/budgets");
        } catch (error) {
            // Error handling is already done in the hook via toast
            console.error(error);
        }
    };

    return {
        form,
        isPending: isCreating,
        onSubmit,
        handleGenerateAI,
    }
}
