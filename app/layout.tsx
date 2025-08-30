// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import RegisterSW from "./register-sw";
import AppHeader from "@/components/ui/AppHeader";

export const metadata: Metadata = {
  title: {
    default: "Bob Electricista - Calculadora de Proyectos",
    template: "%s | Bob Electricista",
  },
  description: "Cómputo de materiales para instalaciones eléctricas.",
  applicationName: "Bob Electricista",
  manifest: "/manifest.webmanifest",
};

const TABS = [
  { href: "/proyecto", label: "Proyectos" },
  { href: "/ayuda", label: "Ayuda" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className="h-full">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <RegisterSW />
        <AppHeader tabs={TABS} />
        {/* --- ESTA LÍNEA ES LA QUE CAMBIA --- */}
        <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">{children}</main>
        
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-foreground/60">
          Funciona offline (PWA)
        </footer>
      </body>
    </html>
  );
}