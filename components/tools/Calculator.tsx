"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalculatorTool() {
    const [display, setDisplay] = useState("")

    const handleClick = (value: string) => {
        if (value === "=") {
            try {
                // eslint-disable-next-line no-eval
                setDisplay(eval(display).toString())
            } catch (e) {
                setDisplay("Error")
            }
        } else if (value === "C") {
            setDisplay("")
        } else {
            setDisplay(display + value)
        }
    }

    const buttons = [
        "7", "8", "9", "/",
        "4", "5", "6", "*",
        "1", "2", "3", "-",
        "0", "C", "=", "+"
    ]

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Calculadora Rápida</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <Input
                    value={display}
                    readOnly
                    className="text-right text-lg font-mono"
                    placeholder="0"
                />
                <div className="grid grid-cols-4 gap-2">
                    {buttons.map((btn) => (
                        <Button
                            key={btn}
                            variant={btn === "=" ? "default" : "outline"}
                            onClick={() => handleClick(btn)}
                            className="text-lg font-medium"
                        >
                            {btn}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
