"use client"

import * as React from "react"
import { Check, Loader2, Plus } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

import { cn, hexToRgba } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import useBudgetCategories from "@/components/budgets/categories/hooks/useBudgetCategories"

export function CategoryFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { categories, isLoading } = useBudgetCategories()

    const selectedValues = new Set(searchParams.get("categories")?.split(",").filter(Boolean) || [])

    const handleSelect = (categoryId: string) => {
        const params = new URLSearchParams(searchParams.toString())
        const current = new Set(params.get("categories")?.split(",").filter(Boolean) || [])

        if (current.has(categoryId)) {
            current.delete(categoryId)
        } else {
            current.add(categoryId)
        }

        if (current.size > 0) {
            params.set("categories", Array.from(current).join(","))
        } else {
            params.delete("categories")
        }

        // Reset page on filter change
        params.set("page", "1")

        router.push(`?${params.toString()}`)
    }

    const handleClear = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("categories")
        params.set("page", "1")
        router.push(`?${params.toString()}`)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Categorías
                    {selectedValues.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 3 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} seleccionadas
                                    </Badge>
                                ) : (
                                    categories
                                        .filter((cat) => selectedValues.has(cat.id))
                                        .map((cat) => (
                                            <Badge
                                                key={cat.id}
                                                className={cn(
                                                    "rounded-sm px-2 font-normal border-transparent text-secondary-foreground",
                                                    cat.color ? "" : "bg-secondary"
                                                )}
                                                style={cat.color ? { backgroundColor: hexToRgba(cat.color, 0.2) } : {}}
                                            >
                                                {cat.name}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                {isLoading ? (
                    <div className="py-5 flex-col flex items-center justify-center">
                        <span>Cargando categorías</span>
                        <Loader2 className="animate-spin" />
                    </div>
                ) : (
                    <Command>
                        <CommandInput placeholder="Categoría..." />
                        <CommandList>
                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                            <CommandGroup>
                                {categories.map((category) => {
                                    const isSelected = selectedValues.has(category.id)
                                    return (
                                        <CommandItem
                                            key={category.id}
                                            disabled={!category.isActive}
                                            onSelect={() => handleSelect(category.id)}
                                        >
                                            <div className="flex items-center">

                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                <span>{category.name}</span>
                                            </div>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                            {selectedValues.size > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={handleClear}
                                            className="justify-center text-center"
                                        >
                                            Limpiar filtros
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                )}
            </PopoverContent>
        </Popover>
    )
}
