"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

export function NominalRateConverter() {
    const [liquidRate, setLiquidRate] = useState<string>("")
    const [nominalRate, setNominalRate] = useState<string>("")
    const [taxRate, setTaxRate] = useState<string>("18.1")

    const calculateNominal = (liquid: string, rate: string) => {
        const liqVal = parseFloat(liquid)
        const rateVal = parseFloat(rate)
        if (!isNaN(liqVal) && !isNaN(rateVal) && rateVal < 100) {
            return (liqVal / (1 - (rateVal / 100))).toFixed(2)
        }
        return ""
    }

    const calculateLiquid = (nominal: string, rate: string) => {
        const nomVal = parseFloat(nominal)
        const rateVal = parseFloat(rate)
        if (!isNaN(nomVal) && !isNaN(rateVal)) {
            return (nomVal * (1 - (rateVal / 100))).toFixed(2)
        }
        return ""
    }

    const handleLiquidChange = (value: string) => {
        setLiquidRate(value)
        if (value === "") {
            setNominalRate("")
            return
        }
        setNominalRate(calculateNominal(value, taxRate))
    }

    const handleNominalChange = (value: string) => {
        setNominalRate(value)
        if (value === "") {
            setLiquidRate("")
            return
        }
        setLiquidRate(calculateLiquid(value, taxRate))
    }

    const handleRateChange = (value: string) => {
        setTaxRate(value)
        if (liquidRate) {
            setNominalRate(calculateNominal(liquidRate, value))
        }
    }

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Conversor de Hora Nominal</CardTitle>
                <CardDescription>Calcula tu hora nominal basada en lo que quieres recibir en mano.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="liquid-rate">Hora Líquida (En mano)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                            id="liquid-rate"
                            type="number"
                            placeholder="0.00"
                            className="pl-7"
                            value={liquidRate}
                            onChange={(e) => handleLiquidChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nominal-rate">Hora Nominal (A facturar)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                            id="nominal-rate"
                            type="number"
                            placeholder="0.00"
                            className="pl-7 font-bold"
                            value={nominalRate}
                            onChange={(e) => handleNominalChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="tax-rate" className="text-sm text-muted-foreground">Aportes Personales (%)</Label>
                    </div>
                    <div className="relative">
                        <Input
                            id="tax-rate"
                            type="number"
                            value={taxRate}
                            onChange={(e) => handleRateChange(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        No recomendado cambiar (Valor estándar)
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
