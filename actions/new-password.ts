"use server"

import { getPasswordResetTokenByToken } from "@/data/password-reset-token"
import { getUserByEmail } from "@/data/user"
import { db } from "@/lib/db"
import { NewPasswordSchema } from "@/schemas/auth-schemas"
import bcrypt from "bcryptjs"
import * as z from "zod"

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: "Token faltante!" }
  }

  const validatedFields = NewPasswordSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "La contraseña no es válida" }
  }

  const { password } = validatedFields.data

  const existingToken = await getPasswordResetTokenByToken(token)

  if (!existingToken) {
    return { error: "Token inválido" }
  }

  const hasExpired = new Date(existingToken.expires).getTime() < Date.now()

  if (hasExpired) {
    return { error: "Token expirado" }
  }

  const existingUser = await getUserByEmail(existingToken.email)

  if (!existingUser) {
    return { error: "Email no encontrado" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.user.update({
    where: {
      id: existingUser.id
    },
    // The reset link proves the mailbox, so it also verifies the email, and
    // every session issued before ends.
    data: {
      password: hashedPassword,
      emailVerified: existingUser.emailVerified ?? new Date(),
      sessionVersion: { increment: 1 }
    }
  })

  await db.passwordResetToken.delete({
    where: {
      id: existingToken.id
    }
  })

  return { success: "Contraseña actualizada" }
}
