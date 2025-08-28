// app/proyecto/page.tsx

"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { listProjects, createProject, removeProject } from "@/lib/project/storage";
import Link from "next/link";
import type { Project } from "@/lib/project/types";

export default function ProyectosPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [name, setName] = useState("");

  async function refresh() {
    setRows(await listProjects());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!name.trim()) return;
    const p = await createProject({ name: name.trim() });
    setName("");
    // Navegamos directamente a la nueva calculadora para la mejor experiencia
    window.location.href = `/proyecto/${p.id}/calculo`;
  }

  async function onDelete(id: string) {
    await removeProject(id);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mis Proyectos de Electricidad</h1>
        <p className="text-foreground/70">
          Crea un proyecto nuevo o continúa con uno existente.
        </p>
      </header>

      {/* --- Crear Nuevo Proyecto --- */}
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Crear Nuevo Proyecto</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input w-full" /* ✅ Usamos la clase .input */
            placeholder="Ej: Casa Familia Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }}
          />
          <button onClick={onCreate} className="btn btn-primary flex-shrink-0"> {/* ✅ Usamos .btn y .btn-primary */}
            Crear y Abrir Calculadora
          </button>
        </div>
      </div>

      {/* --- Proyectos Existentes --- */}
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Proyectos Existentes</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/60 text-center py-4">No hay proyectos guardados.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((p) => (
              <div key={p.id} className="card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-foreground/60">
                    Actualizado: {new Date(p.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                  <Link href={`/proyecto/${p.id}/calculo`} className="btn btn-secondary w-full"> {/* ✅ Usamos .btn-secondary */}
                    Editar/Ver Cálculo
                  </Link>
                  <Link href={`/proyecto/${p.id}/export`} className="btn btn-ghost w-full"> {/* ✅ .btn-ghost es útil aquí */}
                    Resumen y Exportar
                  </Link>
                  <ConfirmDialog onConfirm={() => onDelete(p.id)}>
                     {/* El componente ConfirmDialog ahora renderiza el botón de peligro */}
                    <button className="btn btn-danger w-full">Eliminar</button>
                  </ConfirmDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}