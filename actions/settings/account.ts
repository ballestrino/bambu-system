"use server"

import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/mail"
import { getSessionUser } from "@/lib/session-user"
import { generateVerificationToken } from "@/lib/tokens"
import {
  UpdateEmailSchema,
  UpdateNameSchema,
  UpdateProfileImageSchema,
  getSettingsValidationError,
  type UpdateEmailValues,
  type UpdateNameValues,
  type UpdateProfileImageValues
} from "@/schemas/settings"

export const updateName = async (values: UpdateNameValues) => {
  try {
    const user = await getSessionUser()
    if (!user) return { error: "No autenticado" }

    const validatedFields = UpdateNameSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: getSettingsValidationError(validatedFields.error) }
    }

    await db.user.update({
      where: { id: user.id },
      data: { name: validatedFields.data.name }
    })

    return { success: "Nombre actualizado" }
  } catch {
    return { error: "Algo salió mal" }
  }
}

export const updateEmail = async (values: UpdateEmailValues) => {
  try {
    const user = await getSessionUser()
    if (!user) return { error: "No autenticado" }

    const validatedFields = UpdateEmailSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: getSettingsValidationError(validatedFields.error) }
    }

    if (!user.password || !user.email) {
      return { error: "El usuario no tiene contraseña (cuenta vinculada)" }
    }

    const { email, password } = validatedFields.data

    if (email === user.email) {
      return { error: "Ese ya es tu correo electrónico" }
    }

    const used = await db.user.findFirst({ where: { email } })
    if (used) return { error: "El email ya está en uso" }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) return { error: "Contraseña incorrecta" }

    // The address being replaced comes from the database, never the client:
    // newVerification moves whichever account owns it.
    const verificationToken = await generateVerificationToken(email, user.email)
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return { success: "Email de verificación enviado" }
  } catch {
    return { error: "Algo salió mal" }
  }
}

export const updateProfileImage = async (values: UpdateProfileImageValues) => {
  try {
    const user = await getSessionUser()
    if (!user) return { error: "No autenticado" }

    const validatedFields = UpdateProfileImageSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: getSettingsValidationError(validatedFields.error) }
    }

    // Uploads stay off until feature 5 decides whether Cloudinary stays.
    return { success: "Actualización de imagen desactivada" }
  } catch {
    return { error: "Algo salió mal" }
  }
}
