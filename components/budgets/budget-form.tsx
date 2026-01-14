"use client";

import { useEffect, useState } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

import { calculateBudgetTotals, calculateEstimates } from "@/lib/budget-calculations";
import { BudgetFormValues } from "./schema";

export const BudgetForm = () => {
    const form = useFormContext<BudgetFormValues>();
    const { setValue, control } = form;

    // Watch all relevant fields
    const values = useWatch({ control });

    // State for accordion
    const [activeSection, setActiveSection] = useState<"details" | "costs" | "contributions">("details");

    // Effect 1: Auto-calculate Estimates (Transport & Products)
    useEffect(() => {
        const estimates = calculateEstimates(values);

        setValue("transportation_cost", estimates.transportation_cost);
        setValue("products_price", estimates.products_price);

    }, [
        values.visits,
        values.visit_type,
        values.hours_per_visit,
        values.employees,
        setValue
    ]);

    // Effect 2: Sync Price
    useEffect(() => {
        const totals = calculateBudgetTotals(values);
        setValue("price", Number(totals.totalFinalWithProducts.toFixed(2)));
    }, [
        values.visits,
        values.visit_type,
        values.hours_per_visit,
        values.employees,
        values.nominal_hour,
        values.revenue_percent,
        values.iva,
        values.incidence_enabled,
        values.incidence_contribution,
        values.company_enabled,
        values.company_contribution,
        values.personal_enabled,
        values.personal_contribution,
        values.transportation_cost,
        values.products_price,
        setValue
    ]);

    const toggleSection = (section: "details" | "costs" | "contributions") => {
        setActiveSection(activeSection === section ? section : section);
    };

    return (
        <div className="space-y-4">
            {/* Details Section */}
            <BudgetSection
                title="Detalles"
                isOpen={activeSection === "details"}
                onToggle={() => toggleSection("details")}
                summary={
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                            <span className="text-muted-foreground block text-xs">Nombre</span>
                            <span className="font-medium text-foreground">{values.name || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Visitas</span>
                            <span className="font-medium text-foreground">{values.visits || 0} ({values.visit_type === 'days' ? 'Días' : values.visit_type === 'week' ? 'Semanal' : 'Mensual'})</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Horas/Visita</span>
                            <span className="font-medium text-foreground">{values.hours_per_visit || 0}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Empleados</span>
                            <span className="font-medium text-foreground">{values.employees || 0}</span>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
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
                            control={form.control}
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
                            control={form.control}
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
                            control={form.control}
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
                            control={form.control}
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
                            control={form.control}
                            name="nominal_hour"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio Hora Nominal</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
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

            {/* Costs Section */}
            <BudgetSection
                title="Costos e Ingresos"
                isOpen={activeSection === "costs"}
                onToggle={() => toggleSection("costs")}
                summary={
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                            <span className="text-muted-foreground block text-xs">Costo Transporte</span>
                            <span className="font-medium text-foreground">${values.transportation_cost || 0}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Costo Productos</span>
                            <span className="font-medium text-foreground">${values.products_price || 0}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Ganancia</span>
                            <span className="font-medium text-foreground">{values.revenue_percent || 0}%</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">IVA</span>
                            <span className="font-medium text-foreground">{values.iva || 0}%</span>
                        </div>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="transportation_cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo Transporte</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="products_price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo de Productos</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="revenue_percent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ganancia (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="iva"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>IVA (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </BudgetSection>

            {/* Contributions Section */}
            <BudgetSection
                title="Contribuciones"
                isOpen={activeSection === "contributions"}
                onToggle={() => toggleSection("contributions")}
                summary={
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                        <div>
                            <span className="text-muted-foreground block text-xs">Incidencias</span>
                            <span className="font-medium text-foreground">{values.incidence_enabled ? `${values.incidence_contribution}%` : 'No'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Patronales</span>
                            <span className="font-medium text-foreground">{values.company_enabled ? `${values.company_contribution}%` : 'No'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Personales</span>
                            <span className="font-medium text-foreground">{values.personal_enabled ? `${values.personal_contribution}%` : 'No'}</span>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Incidence Card */}
                    <FormField
                        control={form.control}
                        name="incidence_enabled"
                        render={({ field: enabledField }) => (
                            <Card className={cn("transition-colors", enabledField.value && "border-blue-500 bg-blue-50/10")}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Incidencias</CardTitle>
                                    <FormControl>
                                        <Switch
                                            checked={enabledField.value}
                                            onCheckedChange={enabledField.onChange}
                                        />
                                    </FormControl>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="incidence_contribution"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Porcentaje (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} disabled={!enabledField.value} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    />

                    {/* Company Card */}
                    <FormField
                        control={form.control}
                        name="company_enabled"
                        render={({ field: enabledField }) => (
                            <Card className={cn("transition-colors", enabledField.value && "border-blue-500 bg-blue-50/10")}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Patronales (Empresa)</CardTitle>
                                    <FormControl>
                                        <Switch
                                            checked={enabledField.value}
                                            onCheckedChange={enabledField.onChange}
                                        />
                                    </FormControl>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="company_contribution"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Porcentaje (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} disabled={!enabledField.value} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    />

                    {/* Personal Card */}
                    <FormField
                        control={form.control}
                        name="personal_enabled"
                        render={({ field: enabledField }) => (
                            <Card className={cn("transition-colors", enabledField.value && "border-blue-500 bg-blue-50/10")}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Personales</CardTitle>
                                    <FormControl>
                                        <Switch
                                            checked={enabledField.value}
                                            onCheckedChange={enabledField.onChange}
                                        />
                                    </FormControl>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="personal_contribution"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Porcentaje (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} disabled={!enabledField.value} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    />
                </div>
            </BudgetSection>
        </div>
    );
};

interface BudgetSectionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    summary?: React.ReactNode;
}

const BudgetSection = ({ title, isOpen, onToggle, children, summary }: BudgetSectionProps) => {
    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </CardHeader>
            {isOpen ? (
                <CardContent>
                    {children}
                </CardContent>
            ) : (
                summary && (
                    <CardContent className="bg-muted/10 pb-4 pt-0">
                        <div className="pt-4">
                            {summary}
                        </div>
                    </CardContent>
                )
            )}
        </Card>
    );
};
