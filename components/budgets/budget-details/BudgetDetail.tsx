"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import { cn } from "@/lib/utils";

interface BudgetDetailProps {
    budget: any; // Using any for now to handle inclusion of budgetOptions
}

export function BudgetDetail({ budget }: BudgetDetailProps) {
    const options = budget.budgetOptions?.[0] || {};
    const totals = calculateBudgetTotals(options);

    const {
        totalHours,
        laborCost,
        transport,
        products,
        personalVal,
        incidenceVal,
        companyVal,
        totalContribsExtra,
        costBasisNoProducts,
        revenueAmountService,
        priceNoTaxProducts,
        ivaAmountService,
        finalPriceService,
        revenueAmountProducts,
        totalPreTaxWithProducts,
        totalIvaWithProducts,
        totalFinalWithProducts
    } = totals;

    return (
        <div className="space-y-8">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{budget.name}</h1>
                    {budget.description && (
                        <p className="text-muted-foreground mt-1">{budget.description}</p>
                    )}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Input Data */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos del Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Frecuencia</span>
                                <span className="font-medium capitalise">
                                    {options.visit_type === 'week' ? 'Semanal' :
                                        options.visit_type === 'month' ? 'Mensual' : 'Por Día'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Visitas</span>
                                <span className="font-medium">{options.visits}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Horas por Visita</span>
                                <span className="font-medium">{options.hours_per_visit} hs</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Empleados</span>
                                <span className="font-medium">{options.employees}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Precio Hora Nominal</span>
                                <span className="font-medium">${options.nominal_hour}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Horas Totales Calc.</span>
                                <span className="font-medium text-blue-600">{totalHours.toFixed(2)} hs</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Costos Directos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Transporte</span>
                                <span className="font-medium">${transport.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Productos (Costo)</span>
                                <span className="font-medium">${products.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contribuciones y Cargas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {/* Personal */}
                            <div className={cn("flex justify-between items-center py-2 border-b", !options.personal_enabled && "opacity-50 grayscale")}>
                                <div className="flex flex-col">
                                    <span className="font-medium">Cargas Personales</span>
                                    <span className="text-xs text-muted-foreground">{options.personal_contribution}% (Incluido en nominal)</span>
                                </div>
                                <span className="font-semibold">${personalVal.toFixed(2)}</span>
                            </div>

                            {/* Company */}
                            <div className={cn("flex justify-between items-center py-2 border-b", !options.company_enabled && "opacity-50 grayscale")}>
                                <div className="flex flex-col">
                                    <span className="font-medium">Cargas Patronales</span>
                                    <span className="text-xs text-muted-foreground">{options.company_contribution}% (Extra)</span>
                                </div>
                                <span className="font-semibold">${companyVal.toFixed(2)}</span>
                            </div>

                            {/* Incidence */}
                            <div className={cn("flex justify-between items-center py-2", !options.incidence_enabled && "opacity-50 grayscale")}>
                                <div className="flex flex-col">
                                    <span className="font-medium">Incidencias</span>
                                    <span className="text-xs text-muted-foreground">{options.incidence_contribution}% (Extra)</span>
                                </div>
                                <span className="font-semibold">${incidenceVal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between pt-2">
                                <span className="font-bold">Total Extra por Cargas</span>
                                <span className="font-bold text-red-600">${totalContribsExtra.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Financial Summary */}
                <div className="lg:col-span-1">
                    <Card className="h-full border-l-4 border-l-green-500 shadow-sm">
                        <CardHeader>
                            <CardTitle>Resumen Financiero</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Service Section */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Servicio</h3>
                                <div className="flex justify-between text-sm">
                                    <span>Base (Costo)</span>
                                    <span>${costBasisNoProducts.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Ganancia ({options.revenue_percent}%)</span>
                                    <span>${revenueAmountService.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA ({options.iva}%)</span>
                                    <span>${ivaAmountService.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium border-t pt-2">
                                    <span>Subtotal Servicio</span>
                                    <span>${finalPriceService.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Products Section */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Productos</h3>
                                <div className="flex justify-between text-sm">
                                    <span>Base (Costo)</span>
                                    <span>${products.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Ganancia (15%)</span>
                                    <span>${revenueAmountProducts.toFixed(2)}</span>
                                </div>
                                {/* Note: IVA on products is typically same rate? Calculated in utility. */}
                                <div className="flex justify-between font-medium border-t pt-2">
                                    <span>Subtotal Productos (sin IVA)</span>
                                    <span>${priceNoTaxProducts.toFixed(2)}</span>
                                </div>
                            </div>

                            <hr className="border-dashed" />

                            {/* Final Totals */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Total Neto (Sin IVA)</span>
                                    <span>${totalPreTaxWithProducts.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Total IVA</span>
                                    <span>${totalIvaWithProducts.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-green-50 p-4 border border-green-100">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-green-900">Total Final</span>
                                    <span className="text-3xl font-bold text-green-600">
                                        ${totalFinalWithProducts.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-green-700 mt-1 text-right">
                                    Incluye todos los impuestos y costos
                                </p>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
