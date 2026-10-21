"use server"

import * as z from "zod"

import { registerFormSchema } from "@/schemas/auth-schemas"
import { getUserByEmail } from "@/data/user"

import { db } from "@/lib/db"
import { generateVerificationToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/mail"
import { getActionClientIp } from "@/lib/auth/client-ip"
import { AUTH_MAIL_LIMIT_ERROR, reserveAuthMail } from "@/lib/auth/mail-limit"
import { AUTH_LIMITS, reserveAttempt } from "@/lib/auth/rate-limit"

/**
 * Creates an account without a password: the verification link asks for it.
 * Whoever registers an email cannot pick the password the owner activates by
 * opening the link. Registering an unverified email again sends a new link.
 */
export const register = async (values: z.infer<typeof registerFormSchema>) => {
  const validatedFields = registerFormSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Datos inválidos" }
  }

  const { email, name } = validatedFields.data
  const ip = await getActionClientIp()

  const reservation = await reserveAttempt([
    { rule: AUTH_LIMITS.registerIp, key: ip }
  ])

  if (!reservation.allowed) {
    return { error: "Demasiados registros desde esta conexión. Probá más tarde." }
  }

  const existingUser = await getUserByEmail(email)

  if (existingUser?.emailVerified) {
    return { error: "Este email ya esta en uso!" }
  }

  if (!(await reserveAuthMail(email, ip))) {
    return { error: AUTH_MAIL_LIMIT_ERROR }
  }

  if (existingUser) {
    await db.user.update({ where: { id: existingUser.id }, data: { name } })
  } else {
    await db.user.create({ data: { name, email } })
  }

  const verificationToken = await generateVerificationToken(email)

  await sendVerificationEmail(verificationToken.email, verificationToken.token)

  return {
    success: "Te enviamos un email para activar tu cuenta"
  }
}
