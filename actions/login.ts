"use server"

import * as z from "zod"

import { AuthError, CredentialsSignin } from "next-auth"
import { signIn } from "@/auth"
import { loginFormSchema } from "@/schemas/auth-schemas"

import { generateVerificationToken, generateTwoFactorToken } from "@/lib/tokens"
import { sendVerificationEmail, sendTwoFactorEmail } from "@/lib/mail"
import { getActionClientIp } from "@/lib/auth/client-ip"
import { AUTH_MAIL_LIMIT_ERROR, reserveAuthMail } from "@/lib/auth/mail-limit"
import { verifyPasswordAttempt } from "@/lib/auth/password-attempt"
import { confirmTwoFactorCode } from "@/lib/auth/two-factor-code"

const INVALID_LOGIN = "Email o contraseña incorrectos"
const RATE_LIMITED = "Demasiados intentos. Esperá 15 minutos y probá de nuevo."

export const login = async (values: z.infer<typeof loginFormSchema>) => {
  try {
    // SafeParse validate the fields with zod
    const validatedFields = loginFormSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Datos inválidos" }
    }

    const { email, password, code } = validatedFields.data
    const ip = await getActionClientIp()

    // The password is checked before any mail goes out, and an unknown email
    // answers like a wrong password.
    const attempt = await verifyPasswordAttempt(email, password, ip)

    if ("error" in attempt) {
      return { error: attempt.error === "rate_limited" ? RATE_LIMITED : INVALID_LOGIN }
    }

    const { user } = attempt

    if (!user.emailVerified) {
      if (!(await reserveAuthMail(user.email, ip))) {
        return { error: AUTH_MAIL_LIMIT_ERROR }
      }

      const verificationToken = await generateVerificationToken(user.email)

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      )
      return { emailVerification: "Email de verificación enviado!" }
    }

    if (user.isTwoFactorEnabled) {
      if (!code) {
        if (!(await reserveAuthMail(user.email, ip))) {
          return { error: AUTH_MAIL_LIMIT_ERROR }
        }

        const twoFactorToken = await generateTwoFactorToken(user.email)

        await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token)

        return { twoFactor: true }
      }

      const codeError = await confirmTwoFactorCode(user, code)

      if (codeError) return { error: codeError }
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false // Redirect after success in client to be able to update session
    })

    return { success: "Redirigiendo..." }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error:
              (error as CredentialsSignin).code === "rate_limited"
                ? RATE_LIMITED
                : INVALID_LOGIN
          }
        default:
          return { error: "Algo salio mal!" }
      }
    }

    throw error
  }
}
