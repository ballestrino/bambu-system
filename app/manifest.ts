import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f5f7f3",
    description: "Sistema de gestión para Bambú",
    display: "standalone",
    icons: [
      { sizes: "192x192", src: "/icons/icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "/icons/icon-512.png", type: "image/png" },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icons/icon-maskable-512.png",
        type: "image/png",
      },
    ],
    id: "/",
    lang: "es-UY",
    name: "Bambú System",
    scope: "/",
    short_name: "Bambú",
    start_url: "/dashboard",
    theme_color: "#ffffff",
  };
}
