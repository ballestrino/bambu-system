import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { BudgetSchema, defaultBudgetValues, type BudgetFormValues } from '@/schemas/BudgetSchema';
import { useRouter } from 'next/navigation';
import { useCreateBudgetMutation } from '../../hooks/useCreateBudgetMutation';

export default function useCreateBudgetForm() {
    const router = useRouter();

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(BudgetSchema) as unknown as Resolver<BudgetFormValues>,
        defaultValues: defaultBudgetValues,
        mode: "onChange", // Enable real-time validation/observation
    });

    const { createBudgetAsync, isCreating } = useCreateBudgetMutation();

    const onSubmit = async (data: BudgetFormValues) => {
        console.log("Submitting budget data:", data);
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
    }
}
