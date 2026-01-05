import path from "node:path"
import type { PrismaConfig } from "prisma"

import "dotenv/config"

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
} satisfies PrismaConfig
