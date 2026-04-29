"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function evaluateExpression(expression: string): number {
    const sanitized = expression.replace(/\s+/g, "")

    if (!sanitized || !/^[\d+\-*/.]+$/.test(sanitized)) {
        throw new Error("Invalid expression")
    }

    const tokens: Array<number | string> = []
    let i = 0
    let expectNumber = true

    while (i < sanitized.length) {
        const char = sanitized[i]

        if (/\d|\./.test(char)) {
            let numberStr = ""
            let dots = 0

            while (i < sanitized.length && /\d|\./.test(sanitized[i])) {
                if (sanitized[i] === ".") dots++
                numberStr += sanitized[i]
                i++
            }

            if (dots > 1 || numberStr === ".") {
                throw new Error("Invalid number")
            }

            tokens.push(Number(numberStr))
            expectNumber = false
            continue
        }

        if ("+-*/".includes(char)) {
            if (expectNumber) {
                if (char !== "-") {
                    throw new Error("Invalid operator")
                }

                i++

                if (i >= sanitized.length || !/\d|\./.test(sanitized[i])) {
                    throw new Error("Invalid negative number")
                }

                let numberStr = ""
                let dots = 0

                while (i < sanitized.length && /\d|\./.test(sanitized[i])) {
                    if (sanitized[i] === ".") dots++
                    numberStr += sanitized[i]
                    i++
                }

                if (dots > 1 || numberStr === ".") {
                    throw new Error("Invalid number")
                }

                tokens.push(-Number(numberStr))
                expectNumber = false
                continue
            }

            tokens.push(char)
            expectNumber = true
            i++
            continue
        }

        throw new Error("Invalid character")
    }

    if (expectNumber) {
        throw new Error("Incomplete expression")
    }

    const firstPass: Array<number | string> = [tokens[0]]

    for (let index = 1; index < tokens.length; index += 2) {
        const operator = tokens[index] as string
        const number = tokens[index + 1] as number

        if (operator === "*" || operator === "/") {
            const previous = firstPass.pop() as number
            const result = operator === "*" ? previous * number : previous / number

            if (!Number.isFinite(result)) {
                throw new Error("Invalid calculation")
            }

            firstPass.push(result)
        } else {
            firstPass.push(operator, number)
        }
    }

    let result = firstPass[0] as number

    for (let index = 1; index < firstPass.length; index += 2) {
        const operator = firstPass[index] as string
        const number = firstPass[index + 1] as number
        result = operator === "+" ? result + number : result - number
    }

    if (!Number.isFinite(result)) {
        throw new Error("Invalid calculation")
    }

    return result
}

export function CalculatorTool() {
    const [display, setDisplay] = useState("")

    const handleClick = (value: string) => {
        if (value === "=") {
            try {
                setDisplay(evaluateExpression(display).toString())
            } catch {
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
