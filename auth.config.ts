import { CredentialsSignin, type NextAuthConfig } from "next-auth"

import Credentials from "next-auth/providers/credentials"

import { loginFormSchema } from "@/schemas/auth-schemas"
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"
import { getClientIp } from "@/lib/auth/client-ip"
import { verifyPasswordAttempt } from "@/lib/auth/password-attempt"
import Google from "next-auth/providers/google"

export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited"
}

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    Credentials({
      async authorize(credentials, request) {
        const validatedFields = loginFormSchema.safeParse(credentials)
        if (!validatedFields.success) return null

        const { email, password } = validatedFields.data
        // The login action and a direct POST to /api/auth/callback/credentials
        // both land here, so both go through the same limits.
        const attempt = await verifyPasswordAttempt(
          email,
          password,
          getClientIp(request.headers)
        )

        if ("error" in attempt) {
          if (attempt.error === "rate_limited") throw new RateLimitedSignin()
          return null
        }

        const { user } = attempt

        // Answered like a wrong password, so the callback does not reveal a
        // correct password of an unverified or 2FA-pending account. The
        // signIn callback still checks both and consumes the confirmation.
        if (!user.emailVerified) return null
        if (
          user.isTwoFactorEnabled &&
          !(await getTwoFactorConfirmationByUserId(user.id))
        ) {
          return null
        }

        return user
      }
    })
  ]
} satisfies NextAuthConfig
