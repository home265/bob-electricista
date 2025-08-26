"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getProjectById } from "@/lib/storage";
import type { Project, BOMItem } from "@/lib/types";

export default function ExportProyectoPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id);

  const bomAgregado = useMemo(() => {
    if (!project) return [];
    const items = project.partidas.flatMap((p) => p.bom || []);
    return aggregateBOM(items);
  }, [project]);

  // Agrupar circuitos por ambiente (si la partida guardó los circuitos con ese campo)
  const gruposPorAmbiente = useMemo(() => {
    if (!project) return [];
    const electPartidas = project.partidas.filter(p => p.kind === "electrica");
    const filas: Array<{ ambiente: string; nombre: string; resumen: string; createdAt: string; }> = [];
    for (const p of electPartidas) {
      const circuits: any[] = (p.params?.circuitos || []);
      for (const c of circuits) {
        filas.push({ ambiente: c.ambiente || "General", nombre: c.nombre || c.tipoId, resumen: p.summary, createdAt: p.createdAt });
      }
    }
    const map = new Map<string, typeof filas>();
    for (const f of filas) {
      const k = f.ambiente;
      const arr = map.get(k) || [];
      arr.push(f);
      map.set(k, arr);
    }
    return Array.from(map.entries()).map(([amb, arr]) => ({ ambiente: amb, items: arr }));
  }, [project]);

  if (!project) {
    return (
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Proyecto no encontrado</h1>
        <a href="/" className="btn">Volver</a>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="print:hidden flex gap-2">
        <a href={`/proyecto/${id}`} className="btn btn-ghost">Volver</a>
        <button className="btn btn-primary" onClick={() => window.print()}>Imprimir / PDF</button>
      </div>

      <div className="card p-5">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <div className="opacity-80 text-sm">Creado: {new Date(project.createdAt).toLocaleString()}</div>
          </div>
          <div className="opacity-70 text-sm">
            <div><strong>Instalaciones</strong></div>
            <div>Exportado: {new Date().toLocaleString()}</div>
          </div>
        </header>

        <div className="mt-5">
          <h2 className="font-semibold mb-2">Partidas</h2>
          {project.partidas.length === 0 ? (
            <p className="opacity-80 text-sm">No hay partidas.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4 border-b border-[--border]">Tipo</th>
                  <th className="py-2 pr-4 border-b border-[--border]">Resumen</th>
                  <th className="py-2 pr-4 border-b border-[--border]">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {project.partidas.map((p) => (
                  <tr key={p.id} className="border-t border-[--border]">
                    <td className="py-2 pr-4">{p.kind}</td>
                    <td className="py-2 pr-4">{p.summary}</td>
                    <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Circuitos por ambiente */}
        {gruposPorAmbiente.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Circuitos por ambiente</h2>
            {gruposPorAmbiente.map((g) => (
              <div key={g.ambiente} className="mb-4">
                <div className="font-semibold mb-1">{g.ambiente}</div>
                <ul className="list-disc pl-5 text-sm">
                  {g.items.map((it, i) => (<li key={i}>{it.nombre}</li>))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* BOM agregado */}
        <div className="mt-6">
          <h2 className="font-semibold mb-2">BOM agregado</h2>
          {bomAgregado.length === 0 ? (
            <p className="opacity-80 text-sm">No hay materiales.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4 border-b border-[--border]">Código</th>
                  <th className="py-2 pr-4 border-b border-[--border]">Descripción</th>
                  <th className="py-2 pr-4 border-b border-[--border]">DN</th>
                  <th className="py-2 pr-4 border-b border-[--border]">Cant.</th>
                  <th className="py-2 pr-4 border-b border-[--border]">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {bomAgregado.map((i) => (
                  <tr key={i.code + (i.dn_mm ?? "")} className="border-t border-[--border]">
                    <td className="py-2 pr-4">{i.code}</td>
                    <td className="py-2 pr-4">{i.desc}</td>
                    <td className="py-2 pr-4">{i.dn_mm ?? "-"}</td>
                    <td className="py-2 pr-4">{i.qty}</td>
                    <td className="py-2 pr-4">{i.unidad ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 opacity-70 text-xs">
          * Documento imprimible para obra. Para cambiar datos, usar la app.
        </div>
      </div>
    </section>
  );
}

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
