import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { TwoFactorToggle } from "@/components/auth/TwoFactorToggle"
import ChangeName from "@/components/settings/account/change-name"
import ChangeEmail from "@/components/settings/account/change-email"
import ChangePasswordDialog from "@/components/settings/security/change-password-dialog"
import { SignOutButton } from "@/components/settings/sign-out-button"

export default async function SettingsPage() {
    const session = await auth()

    if (!session?.user?.id) redirect("/auth/login")

    const { user } = session

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto p-6">
            <p className="text-2xl font-bold">Configuración</p>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <p className="font-medium">Nombre</p>
                    <ChangeName user={user} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <p className="font-medium">Correo Electrónico</p>
                    <ChangeEmail user={user} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <p className="font-medium">Contraseña</p>
                    <ChangePasswordDialog user={user} />
                </div>

                <TwoFactorToggle initialEnabled={user.isTwoFactorEnabled ?? false} />
            </div>
            <SignOutButton />
        </div>
    )
}
