import { timingSafeEqual } from "crypto"
import type { User } from "@prisma/client"

import { getTwoFactorTokenByEmail } from "@/data/two-factor-token"
import {
  AUTH_LIMITS,
  clearAttempts,
  normalizeEmailKey,
  releaseAttempt,
  reserveAttempt
} from "@/lib/auth/rate-limit"
import { db } from "@/lib/db"

const codesMatch = (expected: string, received: string) => {
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

/**
 * Checks a 2FA code for a user whose password was already verified, and on
 * success leaves the confirmation the signIn callback consumes. Returns an
 * error message or null. Too many wrong codes discard the pending code, so a
 * new one (which needs the password again) is required.
 */
export const confirmTwoFactorCode = async (
  user: Pick<User, "id" | "email">,
  code: string
) => {
  const key = normalizeEmailKey(user.email)
  const reservation = await reserveAttempt([
    { rule: AUTH_LIMITS.twoFactorCode, key }
  ])

  const twoFactorToken = await getTwoFactorTokenByEmail(user.email)

  if (!reservation.allowed) {
    if (twoFactorToken) {
      await db.twoFactorToken.delete({ where: { id: twoFactorToken.id } })
    }
    return "Demasiados intentos. Iniciá sesión de nuevo para recibir otro código."
  }

  if (!twoFactorToken || !codesMatch(twoFactorToken.token, code)) {
    return "Código inválido"
  }

  if (new Date(twoFactorToken.expires) < new Date()) return "El código expiró"

  await releaseAttempt(reservation.ids)
  await clearAttempts(AUTH_LIMITS.twoFactorCode, key)
  await db.twoFactorToken.delete({ where: { id: twoFactorToken.id } })
  await db.twoFactorConfirmation.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {}
  })

  return null
}
