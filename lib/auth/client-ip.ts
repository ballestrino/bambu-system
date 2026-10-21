import { headers } from "next/headers"

/**
 * The caller's IP for rate limits. Vercel overwrites x-real-ip and
 * x-forwarded-for with the real client address, so a client cannot pick its
 * own bucket there. Without either header every caller shares "unknown".
 */
export const getClientIp = (requestHeaders: Headers) =>
  requestHeaders.get("x-real-ip")?.trim() ||
  requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown"

/** The IP of the request running the current Server Action. */
export const getActionClientIp = async () => getClientIp(await headers())
