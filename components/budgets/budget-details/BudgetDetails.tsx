"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateBudgetTotals, PRODUCT_MARGIN_PCT } from "@/lib/budget-calculations";
import { BudgetFormValues, defaultBudgetValues } from "@/schemas/BudgetSchema";

interface BudgetDetailsProps {
    option: any; // Ideally typed as BudgetOption
    title?: string;
}

export const BudgetDetails = ({ option, title }: BudgetDetailsProps) => {
    // Merge with defaults to ensure calculation safety
    const values: BudgetFormValues = {
        ...defaultBudgetValues,
        ...option,
    };

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
    const hasProducts = option.has_products;

    // Determine what to show as the final price at the bottom
    const finalPricePreTax = hasProducts ? totalPreTaxWithProducts : priceNoTaxService;
    const finalPriceWithTax = hasProducts ? totalFinalWithProducts : finalPriceService;

    return (
        <Card className={cn("h-full shadow-lg overflow-y-auto", hasProducts ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-gray-400")}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-xl">
                    <span>{title || (hasProducts ? "Con Productos" : "Sin Productos")}</span>
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

                {/* Service Costs */}
                <div className="space-y-2 pt-2">
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                        Detalle del Servicio
                    </h4>
                    <div className="flex justify-between text-sm">
                        <span>Subtotal (Costos)</span>
                        <span>${costBasisNoProducts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Ganancia ({revenuePct}%)</span>
                        <span>${revenueAmountService.toFixed(2)}</span>
                    </div>

                    {/* If NO products, we show taxes/totals here */}
                    {!hasProducts && (
                        <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>IVA ({ivaPct}%)</span>
                                <span>${ivaAmountService.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span>Precio con IVA</span>
                                <span>${finalPriceService.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Products Section - Only if hasProducts is true */}
                {hasProducts && (
                    <>
                        <hr className="my-4 border-t" />
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                                Productos
                            </h4>
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span>Costo Productos</span>
                                    <span>${products.toFixed(2)}</span>
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
                            </div>
                        </div>
                    </>
                )}

                <hr className="my-4 border-t" />

                {/* Final Price Display */}
                <div className="flex justify-between items-end">
                    <span className="font-bold">Precio sin IVA</span>
                    <span className={cn("text-2xl font-bold", hasProducts ? "text-blue-600" : "text-gray-600")}>
                        ${finalPricePreTax.toFixed(2)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
