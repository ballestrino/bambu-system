import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Solo dev: hosts extra (separados por coma) que pueden pedir /_next, por
  // ejemplo la IP de la PC para probar la app instalada en un iPhone por Wi-Fi.
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",") ?? [],
  turbopack: {
    root: configDirectory,
  },
};

export default nextConfig;
