"use server"

import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session-user"
import {
  UpdatePasswordSchema,
  getSettingsValidationError,
  type UpdatePasswordValues
} from "@/schemas/settings"

export const updatePassword = async (values: UpdatePasswordValues) => {
  try {
    const user = await getSessionUser()
    if (!user) return { error: "No autenticado" }

    const validatedFields = UpdatePasswordSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: getSettingsValidationError(validatedFields.error) }
    }

    if (!user.password) {
      return { error: "El usuario no tiene contraseña (cuenta vinculada)" }
    }

    const { password, newPassword } = validatedFields.data

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) return { error: "Contraseña incorrecta" }

    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return { error: "Debes ingresar una contraseña diferente a la actual" }
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 12) }
    })

    return { success: "Contraseña actualizada" }
  } catch {
    return { error: "Algo salió mal" }
  }
}

export const enable2FA = async () => {
  try {
    const user = await getSessionUser()
    if (!user) return { error: "No autenticado" }

    if (!user.emailVerified) {
      return { error: "Debes verificar tu email primero" }
    }

    if (user.isTwoFactorEnabled) return { error: "2FA ya está habilitado" }

    await db.user.update({
      where: { id: user.id },
      data: { isTwoFactorEnabled: true }
    })

    return { success: "2FA Habilitado" }
  } catch {
    return { error: "Algo salió mal" }
  }
}

export const disable2FA = async () => {
  try {
    const user = await getSessionUser()
    if (!user) return { error: "No autenticado" }

    if (!user.isTwoFactorEnabled) return { error: "2FA no está habilitado" }

    await db.user.update({
      where: { id: user.id },
      data: { isTwoFactorEnabled: false }
    })

    return { success: "2FA Deshabilitado" }
  } catch {
    return { error: "Algo salió mal" }
  }
}
