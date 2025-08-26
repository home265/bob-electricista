// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import RegisterSW from "./register-sw";

export const metadata: Metadata = {
  title: "Instalaciones",
  description:
    "Calculadoras de agua, sanitarios, gas y eléctrica. Proyectos con BOM y exportación.",
  applicationName: "Instalaciones",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0E8388",
  colorScheme: "dark"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* Header minimalista común a todas las apps */}
        <header className="appbar">
          <a href="/" className="appbar__brand">Instalaciones</a>
          <nav className="appbar__nav">
            <a href="/ayuda" className="appbar__link">Ayuda</a>
            <a href="/offline" className="appbar__link">Offline</a>
          </nav>
        </header>

        <main className="container">
          {children}
        </main>

        <footer className="footer">
          <span>© {new Date().getFullYear()} — Calculadoras de obra</span>
        </footer>

        {/* SW para PWA/offline */}
        <RegisterSW />
      </body>
    </html>
  );
}
