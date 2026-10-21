import bcrypt from "bcryptjs"
import type { User } from "@prisma/client"

import { getUserByEmail } from "@/data/user"
import {
  AUTH_LIMITS,
  clearAttempts,
  normalizeEmailKey,
  releaseAttempt,
  reserveAttempt
} from "@/lib/auth/rate-limit"

// Compared when the email has no password, so an unknown email takes as long
// as a wrong password and the timing does not tell them apart.
const DUMMY_HASH = "$2b$10$pz.uO054O86yAlnWeAYOj.SnUVlUX3/pF0p8TABmOBlTLn9UTgG2a"

export type PasswordAttemptResult =
  | { user: User }
  | { error: "invalid" | "rate_limited" }

/**
 * Checks an email and password under the login limits. Used by the login
 * action and by Credentials.authorize, so /api/auth/callback/credentials has
 * the same limits. A wrong password keeps its reservation as a failure; a
 * correct one gives it back and clears that IP's failures for the email.
 */
export const verifyPasswordAttempt = async (
  email: string,
  password: string,
  ip: string
): Promise<PasswordAttemptResult> => {
  const emailKey = normalizeEmailKey(email)
  const ipEmailKey = `${ip}|${emailKey}`

  const reservation = await reserveAttempt([
    { rule: AUTH_LIMITS.loginIpEmail, key: ipEmailKey },
    { rule: AUTH_LIMITS.loginIp, key: ip },
    { rule: AUTH_LIMITS.loginEmail, key: emailKey }
  ])
  if (!reservation.allowed) return { error: "rate_limited" }

  const user = await getUserByEmail(email)
  const passwordsMatch = await bcrypt.compare(
    password,
    user?.password ?? DUMMY_HASH
  )

  if (!user?.password || !passwordsMatch) return { error: "invalid" }

  await releaseAttempt(reservation.ids)
  await clearAttempts(AUTH_LIMITS.loginIpEmail, ipEmailKey)

  return { user }
}
