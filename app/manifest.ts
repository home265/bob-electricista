import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bob Electricista",
    short_name: "Electricista",
    start_url: "/proyecto",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    lang: "es",
    icons: [
      { src: "/favicon.ico", sizes: "64x64 32x32 24x24 16x16", type: "image/x-icon" }
    ],
  };
}
