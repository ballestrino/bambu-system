import { db } from "@/lib/db"

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type RateLimitRule = {
  scope: string
  limit: number
  windowMs: number
}

export const AUTH_LIMITS = {
  // Wrong passwords. The IP + email pair is the tight lock; the per-email
  // limit is high so a stranger cannot lock the owner out cheaply.
  loginIpEmail: { scope: "login:ip-email", limit: 5, windowMs: 15 * MINUTE },
  loginIp: { scope: "login:ip", limit: 30, windowMs: 15 * MINUTE },
  loginEmail: { scope: "login:email", limit: 50, windowMs: HOUR },
  // Wrong 2FA codes per account.
  twoFactorCode: { scope: "2fa:email", limit: 5, windowMs: 15 * MINUTE },
  // Verification, 2FA and reset mails.
  mailRecipient: { scope: "mail:email", limit: 3, windowMs: 15 * MINUTE },
  mailIp: { scope: "mail:ip", limit: 10, windowMs: HOUR },
  registerIp: { scope: "register:ip", limit: 5, windowMs: HOUR }
} satisfies Record<string, RateLimitRule>

export type RateLimitCheck = { rule: RateLimitRule; key: string }

export type Reservation =
  | { allowed: true; ids: string[] }
  | { allowed: false }

export const normalizeEmailKey = (email: string) => email.trim().toLowerCase()

/**
 * Reserves one attempt under every check and then counts, the reservation
 * included, so concurrent requests cannot all slip under a limit. A refused
 * request gives its reservations back: being refused never extends a lock.
 */
export const reserveAttempt = async (
  checks: RateLimitCheck[]
): Promise<Reservation> => {
  const now = Date.now()

  const [rows] = await Promise.all([
    db.$transaction(
      checks.map(({ rule, key }) =>
        db.authAttempt.create({
          data: { scope: rule.scope, key },
          select: { id: true }
        })
      )
    ),
    db.authAttempt.deleteMany({
      where: { createdAt: { lt: new Date(now - DAY) } }
    })
  ])
  const ids = rows.map(row => row.id)

  const counts = await Promise.all(
    checks.map(({ rule, key }) =>
      db.authAttempt.count({
        where: {
          scope: rule.scope,
          key,
          createdAt: { gte: new Date(now - rule.windowMs) }
        }
      })
    )
  )

  if (counts.some((count, index) => count > checks[index].rule.limit)) {
    await releaseAttempt(ids)
    return { allowed: false }
  }

  return { allowed: true, ids }
}

/** Gives back reserved attempts that should not count, like a success. */
export const releaseAttempt = async (ids: string[]) => {
  if (ids.length === 0) return
  await db.authAttempt.deleteMany({ where: { id: { in: ids } } })
}

/** Forgets every attempt of one key, for example after a correct password. */
export const clearAttempts = async (rule: RateLimitRule, key: string) => {
  await db.authAttempt.deleteMany({ where: { scope: rule.scope, key } })
}
