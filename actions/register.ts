"use server"

import * as z from "zod"
import bcrypt from "bcryptjs"

import { registerFormSchema } from "@/schemas/auth-schemas"
import { getUserByEmail } from "@/data/user"

import { db } from "@/lib/db"
import { generateVerificationToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/mail"

export const register = async (values: z.infer<typeof registerFormSchema>) => {
  const validatedFields = registerFormSchema.safeParse(values)

  if (!validatedFields.success) {
    throw new Error("Invalid fields")
  }

  const { email, password, name } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    return { error: "Este email ya esta en uso!" }
  }

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  })

  const verificationToken = await generateVerificationToken(email)

  await sendVerificationEmail(verificationToken.email, verificationToken.token)

  return {
    success: "Email de verificación enviado!"
  }
}
