import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilita encabezado para extender el alcance del SW si lo necesitás
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
