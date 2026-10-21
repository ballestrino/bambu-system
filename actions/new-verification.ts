"use server"

import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { getUserByEmail } from "@/data/user"
import { getVerificationTokenByToken } from "@/data/verification-token"
import { NewPasswordSchema } from "@/schemas/auth-schemas"

/**
 * Verifies an email from its link. A registration link activates the account
 * only with a password set here, by whoever controls the mailbox: without it
 * the answer is needsPassword and the token stays valid.
 */
export const newVerification = async (token: string, password?: string) => {
  const existingToken = await getVerificationTokenByToken(token)

  if (!existingToken) {
    return { error: "La verificación expiro" }
  }

  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) {
    return { error: "El token expiro" }
  }

  if (existingToken.oldemail) {
    const existingUser = await getUserByEmail(existingToken.oldemail)
    if (!existingUser) {
      return { error: "El email a cambiar no esta registrado" }
    }

    try {
      await db.user.update({
        where: {
          id: existingUser.id
        },
        data: {
          emailVerified: new Date(),
          email: existingToken.email
        }
      })
      await db.verificationToken.delete({
        where: { id: existingToken.id }
      })
    } catch {
      return { error: "Hubo un error al actualizar el email" }
    }

    // The JWT callback reloads the user by id, so the session picks up the
    // new address on its next read.
    return { success: "Email actualizado correctamente", emailChanged: true }
  }

  const existingUser = await getUserByEmail(existingToken.email)

  if (!existingUser) {
    return { error: "El email no existe" }
  }

  if (!existingUser.emailVerified) {
    if (password === undefined) return { needsPassword: true }

    const validatedFields = NewPasswordSchema.safeParse({ password })

    if (!validatedFields.success) {
      return { error: "La contraseña no es válida" }
    }

    // Replaces any password set before verification (accounts registered
    // before this flow had one chosen by whoever registered).
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        password: await bcrypt.hash(validatedFields.data.password, 10),
        sessionVersion: { increment: 1 }
      }
    })
  }

  await db.verificationToken.delete({
    where: { id: existingToken.id }
  })

  return { success: "Email verificado correctamente" }
}
