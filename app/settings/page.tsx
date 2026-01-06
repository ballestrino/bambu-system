"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { TwoFactorToggle } from "@/components/auth/TwoFactorToggle"
import ChangeName from "@/components/settings/account/change-name"
import ChangeEmail from "@/components/settings/account/change-email"
import ChangePasswordDialog from "@/components/settings/security/change-password-dialog"
import { useSession } from "next-auth/react"

export default function SettingsPage() {
    const { data: session, update } = useSession()

    const handleSignOut = async () => {
        await signOut()
    }

    if (session) {
        return (
            <div className="flex flex-col gap-6 max-w-md mx-auto p-6">
                <p className="text-2xl font-bold">Configuración</p>


                {session.user?.id && (
                    <div className="flex flex-col gap-4">


                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <p className="font-medium">Nombre</p>
                            <ChangeName user={session.user} update={() => update()} />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <p className="font-medium">Correo Electrónico</p>
                            <ChangeEmail user={session.user} />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <p className="font-medium">Contraseña</p>
                            <ChangePasswordDialog user={session.user} />
                        </div>

                        <TwoFactorToggle
                            initialEnabled={session.user.isTwoFactorEnabled ?? false}
                            userId={session.user.id}
                        />
                    </div>
                )}
                <Button variant="outline" onClick={handleSignOut} className="cursor-pointer">Cerrar Sesión</Button>
            </div>
        )
    }

    return (
        <div>
            <Button asChild>
                <Link href={"/auth/login"}>Login</Link>
            </Button>
        </div>
    )
}
