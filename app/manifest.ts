// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Instalaciones",
    short_name: "Instalaciones",
    description:
      "Calculadoras de obra: agua, sanitarios, gas y eléctrica, con proyectos y BOM.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f10",
    theme_color: "#0E8388",
   // icons: [
   //   { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
   //   { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
   // ]
  };
}
