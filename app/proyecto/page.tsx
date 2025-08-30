// app/proyecto/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { listProjects, createProject, removeProject } from "@/lib/project/storage";
import Link from "next/link";
import type { Project } from "@/lib/project/types";

export default function ProyectosPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const router = useRouter();

  async function refresh() {
    setRows(await listProjects());
  }
  
  useEffect(() => {
    refresh();
  }, []);

  async function onCreateAndOpen() {
    if (!name.trim()) {
        alert("Por favor, ingresa un nombre para el proyecto.");
        return;
    }
    const p = await createProject({ name: name.trim() });
    // Navegamos directamente a la calculadora del nuevo proyecto
    router.push(`/proyecto/${p.id}/calculo`);
  }

  async function onDelete(id: string, projectName: string) {
    // Usamos un confirm nativo simple para consistencia con las otras apps
    if (window.confirm(`¿Estás seguro de que querés eliminar el proyecto "${projectName}"?`)) {
        await removeProject(id);
        await refresh();
    }
  }

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mis Proyectos de Electricidad</h1>
        <p className="text-sm text-foreground/70">
          Crea un proyecto nuevo o continúa con uno existente.
        </p>
      </header>

      {/* --- Crear Nuevo Proyecto (Estilo Bob Gasista) --- */}
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Crear Nuevo Proyecto</h2>
        <form onSubmit={(e) => { e.preventDefault(); onCreateAndOpen(); }} className="flex flex-col sm:flex-row gap-2">
          <input
            className="input w-full"
            placeholder="Ej: Casa Familia Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary flex-shrink-0">
            Crear y Abrir Calculadora
          </button>
        </form>
      </div>

      {/* --- Proyectos Existentes (Estilo Bob Gasista) --- */}
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Proyectos Existentes</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/70 pt-2">No hay proyectos todavía. ¡Crea el primero!</p>
        ) : (
          <div className="space-y-3">
            {rows.map((p) => (
              <div key={p.id} className="card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-foreground/60">
                    Actualizado: {new Date(p.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                  <Link href={`/proyecto/${p.id}/calculo`} className="btn btn-primary w-full justify-center">
                    Editar/Ver Cálculo
                  </Link>
                  <Link href={`/proyecto/${p.id}`} className="btn btn-secondary w-full justify-center">
                    Ver Resumen y Exportar
                  </Link>
                  <button 
                    onClick={() => onDelete(p.id, p.name)}
                    className="btn btn-danger w-full justify-center"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}