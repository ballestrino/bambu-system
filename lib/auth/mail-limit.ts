import {
  AUTH_LIMITS,
  normalizeEmailKey,
  reserveAttempt
} from "@/lib/auth/rate-limit"

export const AUTH_MAIL_LIMIT_ERROR =
  "Ya enviamos varios correos. Esperá unos minutos y probá de nuevo."

/**
 * Reserves one auth mail (verification, 2FA or reset) for a recipient and an
 * IP. Call it right before sending; false means the mail must not go out.
 */
export const reserveAuthMail = async (email: string, ip: string) => {
  const reservation = await reserveAttempt([
    { rule: AUTH_LIMITS.mailRecipient, key: normalizeEmailKey(email) },
    { rule: AUTH_LIMITS.mailIp, key: ip }
  ])

  return reservation.allowed
}
