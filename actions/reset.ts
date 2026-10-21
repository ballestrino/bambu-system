"use server"

import * as z from "zod"

import { ResetSchema } from "@/schemas/auth-schemas"
import { getUserByEmail } from "@/data/user"
import { sendPasswordResetEmail } from "@/lib/mail"
import { generatePasswordResetToken } from "@/lib/tokens"
import { getActionClientIp } from "@/lib/auth/client-ip"
import { AUTH_MAIL_LIMIT_ERROR, reserveAuthMail } from "@/lib/auth/mail-limit"

// The same answer for registered and unknown emails, so the form does not
// tell which emails have an account.
const RESET_SENT = "Si el email está registrado, te enviamos un correo"

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Email Inválido" }
  }

  try {
    const { email } = validatedFields.data

    if (!(await reserveAuthMail(email, await getActionClientIp()))) {
      return { error: AUTH_MAIL_LIMIT_ERROR }
    }

    const existingUser = await getUserByEmail(email)

    if (!existingUser) {
      return { success: RESET_SENT }
    }

    const passwordResetToken = await generatePasswordResetToken(email)

    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    )

    return { success: RESET_SENT }
  } catch  {
    return { error: "Error enviando email" }
  }
}
