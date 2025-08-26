"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Project, BOMItem } from "@/lib/types";
import { getProjectById, removePartida, deleteProject } from "@/lib/storage";

export default function ProyectoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const p = getProjectById(id);
    if (!p) {
      router.replace("/");
      return;
    }
    setProject(p);
  }, [id, router]);

  function refresh() {
    const p = getProjectById(id);
    setProject(p);
  }

  function onRemovePartida(pid: string) {
    const ok = window.confirm("¿Quitar esta partida del proyecto?");
    if (!ok) return;
    removePartida(id, pid);
    refresh();
  }

  function onDeleteProject() {
    const ok = window.confirm("¿Eliminar proyecto completo? Esta acción no se puede deshacer.");
    if (!ok) return;
    deleteProject(id);
    router.replace("/");
  }

  // ===== Aggregado de BOM (por código + unidad + DN si lo tuviera)
  const bomAgregado = useMemo(() => {
    if (!project) return [];
    const items = project.partidas.flatMap((p) => p.bom || []);
    return aggregateBOM(items);
  }, [project]);

  if (!project) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
  <a href={`/proyecto/nuevo/electrica`} className="btn">Nueva partida Eléctrica</a>
  <a href={`/proyecto/${id}/export`} className="btn btn-ghost">Vista imprimible</a>
  <button className="btn btn-ghost" onClick={exportJSON}>Exportar JSON</button>
  <button className="btn btn-ghost" onClick={() => exportCSV_Agregado(project)}>CSV (agregado)</button>
  <button className="btn btn-ghost" onClick={() => exportCSV_Detallado(project)}>CSV (detallado)</button>
  <button className="btn btn-danger" onClick={onDeleteProject}>Eliminar proyecto</button>
</div>


      {/* Partidas */}
      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Partidas</h2>
        {project.partidas.length === 0 ? (
          <p className="opacity-80 text-sm">Aún no agregaste partidas.</p>
        ) : (
          <div className="card--table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Resumen</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {project.partidas.map((p) => (
                  <tr key={p.id} className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{p.kind}</td>
                    <td className="py-2 pr-4">{p.summary}</td>
                    <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <button className="btn btn-danger" onClick={() => onRemovePartida(p.id)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOM agregado */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">BOM agregado del proyecto</h2>
        </div>
        {bomAgregado.length === 0 ? (
          <p className="opacity-80 text-sm">No hay materiales aún.</p>
        ) : (
          <div className="card--table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Descripción</th>
                  <th className="py-2 pr-4">DN</th>
                  <th className="py-2 pr-4">Cantidad</th>
                  <th className="py-2 pr-4">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {bomAgregado.map((i) => (
                  <tr key={i.code + (i.dn_mm ?? "")} className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{i.code}</td>
                    <td className="py-2 pr-4">{i.desc}</td>
                    <td className="py-2 pr-4">{i.dn_mm ?? "-"}</td>
                    <td className="py-2 pr-4">{i.qty}</td>
                    <td className="py-2 pr-4">{i.unidad ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  /* ===== Helpers locales ===== */

  function exportJSON() {
    if (!project) return;
    const content = JSON.stringify(project, null, 2);
    downloadTextFile(`proyecto_${safe(project.name)}.json`, content, "application/json;charset=utf-8");
  }

  function exportCSV_Agregado(p: Project) {
    const rows = [["code", "desc", "dn_mm", "qty", "unidad"]];
    for (const i of bomAgregado) {
      rows.push([i.code, i.desc, String(i.dn_mm ?? ""), String(i.qty), i.unidad ?? ""]);
    }
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    downloadTextFile(`proyecto_${safe(p.name)}_BOM_agregado.csv`, csv, "text/csv;charset=utf-8");
  }

  function exportCSV_Detallado(p: Project) {
    const rows = [["partida_id", "kind", "code", "desc", "dn_mm", "qty", "unidad"]];
    for (const part of p.partidas) {
      for (const i of part.bom ?? []) {
        rows.push([part.id, part.kind, i.code, i.desc, String(i.dn_mm ?? ""), String(i.qty), i.unidad ?? ""]);
      }
    }
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    downloadTextFile(`proyecto_${safe(p.name)}_BOM_detallado.csv`, csv, "text/csv;charset=utf-8");
  }
}

/* ===== utilidades puras ===== */

function aggregateBOM(items: BOMItem[]): BOMItem[] {
  const map = new Map<string, BOMItem>();
  for (const i of items) {
    const key = [i.code, i.unidad ?? "", i.dn_mm ?? ""].join("|");
    const prev = map.get(key);
    if (prev) map.set(key, { ...prev, qty: prev.qty + i.qty });
    else map.set(key, { ...i });
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(v: string) {
  if (v == null) return "";
  const needs = /[",\n]/.test(v);
  return needs ? `"${v.replace(/"/g, '""')}"` : v;
}

function safe(name: string) {
  return name.replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
}
