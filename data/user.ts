import { db } from "@/lib/db"

// A missing user is null; a database failure throws, so callers do not read
// it as "not registered".
export const getUserByEmail = async (email: string) =>
  db.user.findUnique({
    where: {
      email: email
    }
  })

export const getUserById = async (id: string) =>
  db.user.findUnique({
    where: {
      id: id
    }
  })
