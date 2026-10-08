import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Solo dev: hosts extra (separados por coma) que pueden pedir /_next, por
  // ejemplo la IP de la PC para probar la app instalada en un iPhone por Wi-Fi.
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",") ?? [],
  experimental: {
    // Con el caché de Turbopack que Vercel restaura del deploy anterior, el
    // build del 2026-10-08 compiló un app/globals.css viejo (sin las reglas
    // de la app instalada) aunque el archivo había cambiado. Sin este caché
    // cada build compila desde el código.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    root: configDirectory,
  },
};

export default nextConfig;
