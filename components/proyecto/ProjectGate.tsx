// components/proyecto/ProjectGate.tsx
"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import {
  createProject, getCurrentProject, getCurrentProjectId,
  listProjects, setCurrentProjectId, deleteProject
} from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function ProjectGate() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [current, setCurrent] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    setMounted(true);
    refresh();
    if (!getCurrentProjectId()) setOpen(true);
  }, []);

  function refresh() {
    setProjects(listProjects());
    setCurrent(getCurrentProject());
  }

  if (!mounted) return null;

  function handleCreate() {
    if (!name.trim()) return;
    const p = createProject(name.trim());
    setName("");
    setOpen(false);
    setCurrent(p);
    setProjects(listProjects());
  }

  function selectProject(id: string) {
    setCurrentProjectId(id);
    refresh();
    setOpen(false);
  }

  function openProject(id: string) {
    setCurrentProjectId(id);
    refresh();
    setOpen(false);
    router.push(`/proyecto/${id}`);
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditingName(p.name);
  }

  function saveEdit(p: Project) {
    const newName = editingName.trim();
    if (!newName) return setEditingId(null);
    // actualizar y persistir rápido (sin tocar storage.ts)
    const all = listProjects();
    const idx = all.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], name: newName };
      window.localStorage.setItem("inst_proyectos", JSON.stringify(all));
    }
    setEditingId(null);
    refresh();
  }

  function removeProject(p: Project) {
    const ok = window.confirm(`¿Eliminar el proyecto "${p.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    deleteProject(p.id);
    if (current?.id === p.id) {
      setCurrent(null);
    }
    refresh();
  }

  return (
    <>
      {/* Barra superior */}
      <div className="mb-6 rounded-2xl border p-3 flex items-center justify-between card">
        <div className="text-sm">
          {current ? (
            <>
              <div className="opacity-80">Proyecto activo</div>
              <div className="font-semibold">{current.name}</div>
            </>
          ) : (
            <div className="opacity-80">No hay proyecto activo</div>
          )}
        </div>
        <button className="btn" onClick={() => setOpen(true)}>
          {current ? "Cambiar proyecto" : "Elegir proyecto"}
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="w-full max-w-2xl rounded-2xl card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Seleccionar proyecto</h2>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cerrar</button>
            </div>

            {/* Crear */}
            <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="text-sm opacity-80 mb-2">Crear nuevo</div>
              <div className="flex gap-2">
                <input className="px-3 py-2 rounded-xl w-full" placeholder="Ej: Casa PB + PA / Pérez"
                       value={name} onChange={(e) => setName(e.target.value)} />
                <button className="btn btn-primary" onClick={handleCreate}>Crear y usar</button>
              </div>
            </div>

            {/* Existentes */}
            <div className="mt-4 rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
              <div className="text-sm opacity-80">Existentes</div>
              {projects.length ? (
                <ul className="space-y-2">
                  {projects.map(p => (
                    <li key={p.id} className="rounded-lg px-3 py-2" style={{ background: "var(--muted)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          {editingId === p.id ? (
                            <input
                              className="px-3 py-2 rounded-xl w-full"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEdit(p)}
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="font-medium truncate">{p.name}</div>
                              <div className="text-xs opacity-70">{new Date(p.createdAt).toLocaleString()}</div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editingId === p.id ? (
                            <>
                              <button className="btn btn-primary" onClick={() => saveEdit(p)}>Guardar</button>
                              <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button className="btn" onClick={() => selectProject(p.id)}>Usar</button>
                              <button className="btn btn-ghost" onClick={() => openProject(p.id)}>Ver</button>
                              <button className="btn btn-ghost" onClick={() => startEdit(p)}>Renombrar</button>
                              <button className="btn btn-danger" onClick={() => removeProject(p)}>Eliminar</button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm opacity-80">Aún no hay proyectos.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
