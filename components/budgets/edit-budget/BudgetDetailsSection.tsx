"use client";

import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BudgetFormValues } from "@/schemas/BudgetSchema";
import { BudgetSection } from "./BudgetSection";
import { NominalHourSelector } from "../common/NominalHourSelector";

interface BudgetDetailsSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    values: BudgetFormValues;
}

export const BudgetDetailsSection = ({ isOpen, onToggle, values }: BudgetDetailsSectionProps) => {
    const { control } = useFormContext<BudgetFormValues>();

    return (
        <BudgetSection
            title="Detalles"
            isOpen={isOpen}
            onToggle={onToggle}
            summary={
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                        <span className="text-muted-foreground block text-xs">Nombre</span>
                        <span className="font-medium text-foreground">{values.name || "-"}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Visitas</span>
                        <span className="font-medium text-foreground">
                            {values.visits || 0} {
                                values.visit_type === 'week' ? (values.visits === 1 ? 'vez por semana' : 'veces por semana') :
                                    values.visit_type === 'month' ? (values.visits === 1 ? 'vez al mes' : 'veces al mes') :
                                        (values.visits === 1 ? 'día' : 'días')
                            }
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Hora Nominal</span>
                        <span className="font-medium text-foreground">${values.nominal_hour || 0}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Horas/Visita</span>
                        <span className="font-medium text-foreground">{values.hours_per_visit || 0}</span>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="space-y-4">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Presupuesto</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Proyecto Marzo 2024" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Detalles extra..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={control}
                        name="visits"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Visitas</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="visit_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frecuencia</FormLabel>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    {...field}
                                >
                                    <option value="days">Días</option>
                                    <option value="week">Semanal</option>
                                    <option value="month">Mensual</option>
                                </select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="hours_per_visit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horas por Visita</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="nominal_hour"
                        render={({ field }) => (
                            <NominalHourSelector
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    <FormField
                        control={control}
                        name="employees"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Empleados</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </BudgetSection>
    );
};
