"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface ColorPickerProps {
    value?: string
    onChange: (value: string) => void
    disabled?: boolean
    className?: string
}

export function ColorPicker({
    value = "#afddb6",
    onChange,
    disabled,
    className,
}: ColorPickerProps) {
    const [localValue, setLocalValue] = useState(value)

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    const handleChange = (newValue: string) => {
        setLocalValue(newValue)
        onChange(newValue)
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex h-10 w-full max-w-[120px] items-center gap-2 overflow-hidden rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div
                    className="h-6 w-6 rounded-full border shadow-sm shrink-0"
                    style={{ backgroundColor: localValue }}
                />
                <input
                    type="color"
                    value={localValue}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="text-sm font-medium uppercase text-muted-foreground">
                    {localValue}
                </span>
            </div>
            <Input
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                disabled={disabled}
                maxLength={7}
                className="uppercase"
                placeholder="#000000"
            />
        </div>
    )
}
