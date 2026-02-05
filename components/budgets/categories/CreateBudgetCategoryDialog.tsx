"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreateBudgetCategoryMutation } from "./hooks/useCreateBudgetCategoryMutation"
import { useUpdateBudgetCategoryMutation } from "./hooks/useUpdateBudgetCategoryMutation"
import { useState, useEffect } from "react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { ColorPicker } from "@/components/ui/color-picker"
import { Switch } from "@/components/ui/switch"
import { BudgetCategory } from "@prisma/client"

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string(),
    color: z.string().min(1, "El color es requerido"),
    isActive: z.boolean(),
})

interface Props {
    trigger?: React.ReactNode
    category?: BudgetCategory
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateBudgetCategoryDialog({ trigger, category, open: controlledOpen, onOpenChange }: Props) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const { mutateAsync: createCategory, isPending: isCreating } = useCreateBudgetCategoryMutation()
    const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateBudgetCategoryMutation()

    const isPending = isCreating || isUpdating

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            color: "#afddb6",
            isActive: true,
        },
    })

    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
                description: category.description || "",
                color: category.color || "#afddb6",
                isActive: category.isActive,
            })
        } else {
            form.reset({
                name: "",
                description: "",
                color: "#afddb6",
                isActive: true,
            })
        }
    }, [category, form, open])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (category) {
                await updateCategory({
                    id: category.id,
                    ...values
                })
            } else {
                await createCategory(values)
            }
            setOpen(false)
            if (!category) form.reset()
        } catch (error) {
            console.error(error)
        }
    }

    const title = category ? "Editar Categoría" : "Crear Categoría"
    const description = category
        ? "Modifica los detalles de la categoría."
        : "Crea una nueva categoría para organizar tus presupuestos."
    const actionLabel = category ? "Guardar Cambios" : "Crear"
    const loadingLabel = category ? "Guardando..." : "Creando..."

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger !== null && (
                <DialogTrigger asChild>
                    {trigger === undefined ? <Button type="button">Crear Categoría</Button> : trigger}
                </DialogTrigger>
            )}
            <DialogContent
                className="sm:max-w-[425px]"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Nombre</Label>
                                    <FormControl>
                                        <Input placeholder="Ej: Transporte" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Descripción</Label>
                                    <FormControl>
                                        <Textarea placeholder="Descripción opcional..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Color</Label>
                                    <FormControl>
                                        <ColorPicker
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Activo</Label>
                                        <FormDescription>
                                            Determina si la categoría está disponible para su uso.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? loadingLabel : actionLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
