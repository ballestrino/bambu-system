import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"

import Credentials from "next-auth/providers/credentials"

import { loginFormSchema } from "@/schemas/auth-schemas"
import { getUserByEmail } from "@/data/user"
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginFormSchema.safeParse(credentials)
        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const user = await getUserByEmail(email)
          if (!user || !user.password) return null // user password if the user use a different provider

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) return user
        }

        return null
      }
    })
  ]
} satisfies NextAuthConfig
