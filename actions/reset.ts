"use server"

import * as z from "zod"

import { ResetSchema } from "@/schemas/auth-schemas"
import { getUserByEmail } from "@/data/user"
import { sendPasswordResetEmail } from "@/lib/mail"
import { generatePasswordResetToken } from "@/lib/tokens"

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Email Inválido" }
  }

  try {
    const { email } = validatedFields.data

    const existingUser = await getUserByEmail(email)

    if (!existingUser) {
      return { error: "Email no encontrado" }
    }

    const passwordResetToken = await generatePasswordResetToken(email)

    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    )

    return { success: "Email enviado" }
  } catch (error) {
    return { error: "Error enviando email" }
  }
}
