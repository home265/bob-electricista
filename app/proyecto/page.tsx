"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { listProjects, createProject, removeProject } from "@/lib/project/storage";
import Link from "next/link";

type Row = Awaited<ReturnType<typeof listProjects>>[number];

export default function ProyectosPage() {
  const [rows, setRows] = useState<Row[]>([]);
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
    await refresh();
    location.href = `/proyecto/${p.id}`; // navegar al detalle
  }

  async function onDelete(id: string) {
    await removeProject(id);
    await refresh();
  }

  return (
    <div>
      
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="space-y-3">
          <h2 className="font-semibold">Crear nuevo</h2>
          <div className="flex gap-2">
            <input
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Nombre del proyecto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button onClick={onCreate} className="px-3 py-2 rounded-lg border">
              Crear
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Proyectos</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">No hay proyectos.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {rows.map((p) => (
                <li key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">Actualizado: {new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/proyecto/${p.id}`} className="px-3 py-2 rounded-lg border">Abrir</Link>
                    <ConfirmDialog message="¿Eliminar proyecto?" onConfirm={() => onDelete(p.id)}>
                      Eliminar
                    </ConfirmDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
