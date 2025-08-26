// app/register-sw.tsx
"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const url = "/sw.js";
    const doRegister = async () => {
      try {
        const reg = await navigator.serviceWorker.register(url, { scope: "/" });
        // Auto-actualización
        if (reg.update) reg.update();
        // Log simple de estados
        reg.addEventListener?.("updatefound", () => {

          const installing = reg.installing;
          installing?.addEventListener?.("statechange", () => {
            // console.log("SW state:", installing?.state);
          });
        });
      } catch (e) {
        // console.warn("SW register failed", e);
      }
    };
    // Registrar cuando la página está lista
    if (document.readyState === "complete") doRegister();
    else window.addEventListener("load", doRegister, { once: true });
  }, []);

  return null;
}
