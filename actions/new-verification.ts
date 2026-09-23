"use server"

import { db } from "@/lib/db"
import { getUserByEmail } from "@/data/user"
import { getVerificationTokenByToken } from "@/data/verification-token"

export const newVerification = async (token: string) => {
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

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email
    }
  })

  await db.verificationToken.delete({
    where: { id: existingToken.id }
  })

  return { success: "Email verificado correctamente" }
}
