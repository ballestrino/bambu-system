"use server"

import * as z from "zod"

import { AuthError } from "next-auth"
import { signIn } from "@/auth"
import { loginFormSchema } from "@/schemas/auth-schemas"

import { db } from "@/lib/db"
import { generateVerificationToken, generateTwoFactorToken } from "@/lib/tokens"
import { getUserByEmail } from "@/data/user"
import { sendVerificationEmail, sendTwoFactorEmail } from "@/lib/mail"
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token"
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"

export const login = async (values: z.infer<typeof loginFormSchema>) => {
  try {
    // SafeParse validate the fields with zod
    const validatedFields = loginFormSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid fields" }
    }

    const { email, password, code } = validatedFields.data

    const existingUser = await getUserByEmail(email)

    if (!existingUser || !existingUser.email || !existingUser.password) {
      return { error: "El email no esta registrado" }
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(
        existingUser.email
      )

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      )
      return { emailVerification: "Email de verificación enviado!" }
    }

    if (existingUser.isTwoFactorEnabled && existingUser.email) {
      if (code) {
        const twoFactorToken = await getTwoFactorTokenByEmail(
          existingUser.email
        )

        if (!twoFactorToken) {
          return { error: "Invalid code" }
        }

        if (twoFactorToken.token !== code) {
          return { error: "Invalid code" }
        }

        const hasExpired = new Date(twoFactorToken.expires) < new Date()

        if (hasExpired) {
          return { error: "Code expired" }
        }

        await db.twoFactorToken.delete({
          where: { id: twoFactorToken.id }
        })

        const existingConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        )

        if (existingConfirmation) {
          //delete two factor confirmation
          await db.twoFactorConfirmation.delete({
            where: { id: existingConfirmation.id }
          })
        }

        //create two factor confirmation
        await db.twoFactorConfirmation.create({
          data: {
            userId: existingUser.id
          }
        })
      } else {
        const twoFactorToken = await generateTwoFactorToken(existingUser.email)

        await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token)

        return { twoFactor: true }
      }
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
          return { error: "Datos invalidos" }
        default:
          return { error: "Algo salio mal!" }
      }
    }

    throw error
  }
}
