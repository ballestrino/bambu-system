"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BudgetFormValues } from "@/schemas/BudgetSchema";
import { cn } from "@/lib/utils";
import { calculateBudgetTotals, PRODUCT_MARGIN_PCT } from "@/lib/budget-calculations";



export const BudgetPreview = () => {
    const { control } = useFormContext<BudgetFormValues>();
    const values = useWatch({ control });
    const [isProductsOpen, setIsProductsOpen] = useState(false);

    const totals = calculateBudgetTotals(values);

    // Destructure for easier usage
    const {
        totalHours,
        transport,
        products,
        personalVal,
        incidenceVal,
        companyVal,
        totalContribsExtra,
        costBasisNoProducts,
        revenueAmountService,
        priceNoTaxService,
        ivaAmountService,
        finalPriceService,
        revenueAmountProducts,
        totalPreTaxWithProducts,
        totalIvaWithProducts,
        totalFinalWithProducts
    } = totals;

    const revenuePct = Number(values.revenue_percent) || 0;
    const ivaPct = Number(values.iva) || 0;

    return (
        <Card className="h-full border-l-4 border-l-blue-500 shadow-lg overflow-y-auto max-h-[calc(100vh-100px)]">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-xl">
                    <span>Vista Previa</span>
                    <span className="text-sm font-normal text-muted-foreground">Cálculo en vivo</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Horas Totales</p>
                        <p className="font-medium">{totalHours.toFixed(1)} hrs</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Transporte</p>
                        <p className="font-medium">${transport.toFixed(2)}</p>
                    </div>
                </div>

                <hr className="my-4 border-t" />

                {/* Visual Contribution Breakdown */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Desglose de Contribuciones</h4>
                    <div className="space-y-1 text-sm">
                        <div className={cn("flex justify-between", !values.personal_enabled && "opacity-50 line-through")}>
                            <span className="text-muted-foreground">Personales (Incluido)</span>
                            <span>${personalVal.toFixed(2)}</span>
                        </div>
                        <div className={cn("flex justify-between", !values.company_enabled && "text-muted-foreground")}>
                            <span className="text-muted-foreground">Empresa</span>
                            <span>${companyVal.toFixed(2)}</span>
                        </div>
                        <div className={cn("flex justify-between", !values.incidence_enabled && "text-muted-foreground")}>
                            <span className="text-muted-foreground">Incidencias</span>
                            <span>${incidenceVal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-1 border-t">
                        <span>Costo Contrib. Extra</span>
                        <span>${totalContribsExtra.toFixed(2)}</span>
                    </div>
                </div>

                <hr className="my-4 border-t" />

                {/* Price Without Products (Service Only) */}
                <div className="space-y-2 pt-2">
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                        {(values as any).has_products ? "Sin Productos" : "Detalle del Servicio"}
                    </h4>
                    <div className="flex justify-between text-sm">
                        <span>Subtotal (Costos)</span>
                        <span>${costBasisNoProducts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Ganancia ({revenuePct}%)</span>
                        <span>${revenueAmountService.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>IVA ({ivaPct}%)</span>
                        <span>${ivaAmountService.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                        <span>Precio con IVA</span>
                        <span>${finalPriceService.toFixed(2)}</span>
                    </div>
                    <hr className="my-2 border-t" />
                    <div className="flex justify-between items-end">
                        <span className="font-bold">Precio sin IVA</span>
                        <span className="text-2xl font-bold text-blue-600">
                            ${priceNoTaxService.toFixed(2)}
                        </span>
                    </div>
                </div>

                <hr className="my-4 border-t" />

                {/* Price With Products (Collapsible) - Only show if products exist or explicitly enabled */}
                {((values.products_price || 0) > 0 || (values as any).has_products) && (
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsProductsOpen(!isProductsOpen)}
                            className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase text-muted-foreground tracking-wider hover:text-foreground transition-colors"
                            type="button"
                        >
                            <span>Con Productos</span>
                            {isProductsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {isProductsOpen && (
                            <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="flex justify-between text-sm">
                                    <span>Costo Productos</span>
                                    <span>${products.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal (Servicio + Prod.)</span>
                                    <span>${(costBasisNoProducts + products).toFixed(2)}</span>
                                </div>

                                {/* Margins */}
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Ganancia Servicio ({revenuePct}%)</span>
                                    <span>${revenueAmountService.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Ganancia Prod. ({PRODUCT_MARGIN_PCT}%)</span>
                                    <span>${revenueAmountProducts.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>IVA ({ivaPct}%)</span>
                                    <span>${totalIvaWithProducts.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between text-sm font-medium">
                                    <span>Precio con IVA</span>
                                    <span>${totalFinalWithProducts.toFixed(2)}</span>
                                </div>
                                <hr className="my-2 border-t" />
                                <div className="flex justify-between items-end">
                                    <span className="font-bold">Precio sin IVA</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        ${totalPreTaxWithProducts.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
};
