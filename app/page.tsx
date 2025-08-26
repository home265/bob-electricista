// app/page.tsx
"use client";

import ProjectGate from "../components/proyecto/ProjectGate";

export default function Page() {
  return (
    <>
      <ProjectGate />

      <section className="grid gap-6 md:grid-cols-2">
        <a href="/ayuda" className="card p-6 hover:opacity-95">
          <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--color-neutral)" }}>
            Guía rápida
          </h2>
          <p className="text-sm opacity-90">Cómo crear un proyecto, usar la calculadora y exportar el BOM.</p>
          <div className="mt-3"><span className="btn">Abrir manual</span></div>
        </a>

        <a href="/proyecto/nuevo/electrica" className="card p-6 hover:opacity-95">
          <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--color-neutral)" }}>
            Instalación Eléctrica
          </h2>
          <p className="text-sm opacity-90">Sección de cables, MCB/ID y BOM por circuito.</p>
          <div className="mt-3"><span className="btn">Abrir calculadora</span></div>
        </a>
      </section>
    </>
  );
}
