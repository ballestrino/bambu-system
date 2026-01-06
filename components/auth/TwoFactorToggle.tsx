"use client"

import { useState, useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { enable2FA, disable2FA } from "@/actions/settings"
import DeleteDialog from "@/components/ui/delete-dialog"

interface TwoFactorToggleProps {
    initialEnabled?: boolean
    userId: string
}

export function TwoFactorToggle({ initialEnabled = false, userId }: TwoFactorToggleProps) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleEnable = () => {
        setMessage(null)
        startTransition(async () => {
            const result = await enable2FA(userId)
            if (result.error) {
                setMessage({ type: "error", text: result.error })
            } else if (result.success) {
                setIsEnabled(true)
                setMessage({ type: "success", text: "2FA habilitado con éxito" })
            }
        })
    }

    const handleDisable = async () => {
        setMessage(null)
        const result = await disable2FA(userId)
        if (result.error) {
            setMessage({ type: "error", text: result.error })
        } else if (result.success) {
            setIsEnabled(false)
            setMessage({ type: "success", text: "2FA Deshabilitado" })
        }
    }

    const onCheckedChange = (checked: boolean) => {
        if (checked) {
            handleEnable()
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="two-factor-switch" className="text-foreground font-medium">
                        Autenticación de Dos Factores (2FA)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Añade una capa extra de seguridad a tu cuenta
                    </p>
                </div>
                {isEnabled ? (
                    <DeleteDialog
                        title="Desactivar 2FA"
                        description="¿Estás seguro de que quieres desactivar la autenticación de dos factores? Tu cuenta será menos segura."
                        onConfirm={handleDisable}
                        trigger={
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="two-factor-switch"
                                    checked={isEnabled}
                                    onCheckedChange={onCheckedChange}
                                    disabled={isPending}
                                    aria-describedby={message ? "two-factor-message" : undefined}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                        }
                        deleteButtonText="Desactivar"
                    />
                ) : (
                    <Switch
                        id="two-factor-switch"
                        checked={isEnabled}
                        onCheckedChange={onCheckedChange}
                        disabled={isPending}
                        aria-describedby={message ? "two-factor-message" : undefined}
                    />
                )}
            </div>

            {message && (
                <div
                    id="two-factor-message"
                    className={`p-3 rounded-md text-sm ${message.type === "success"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-destructive/15 text-destructive"
                        }`}
                >
                    <p className="text-foreground font-medium">
                        {message.text}
                    </p>
                </div>
            )}
        </div>
    )
}
