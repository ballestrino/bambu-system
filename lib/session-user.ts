import "server-only"

import { auth } from "@/auth"
import { getUserById } from "@/data/user"

/**
 * The signed-in user's database row, or null without a session. Settings
 * actions use it instead of taking a user id from the client.
 */
export const getSessionUser = async () => {
  const session = await auth()
  const id = session?.user?.id

  if (!id) return null

  return (await getUserById(id)) ?? null
}
