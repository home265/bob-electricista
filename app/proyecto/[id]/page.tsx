"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ResultTable from "@/components/ui/ResultTable";
import { getProject } from "@/lib/project/storage";
import { aggregateMaterialsFromProject } from "@/lib/project/compute";
import type { Project } from "@/lib/project/types";

export default function ProyectoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [p, setP] = useState<Project | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getProject(id).then(setP);
  }, [id]);

  const rows = useMemo(() => (p ? aggregateMaterialsFromProject(p) : []), [p]);

  if (!p) return <p className="text-sm text-muted">Cargando proyecto…</p>;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">{p.name}</h1>
        <div className="text-sm text-muted">
          Actualizado: {new Date(p.updatedAt).toLocaleString()}
        </div>
        <div className="flex gap-2">
          <Link href={`/proyecto/${p.id}/calculo`} className="btn">Calcular (ruta nueva)</Link>
          <Link href={`/proyecto/${p.id}/electrica`} className="btn">Calcular (ruta actual)</Link>
          <Link href={`/proyecto/${p.id}/export`} className="btn">Exportar</Link>
        </div>
      </section>

      {p.sketch?.pngDataUrl && (
        <section className="space-y-2">
          <h2 className="font-semibold">Boceto</h2>
          <div className="card overflow-hidden">
            <img src={p.sketch.pngDataUrl} alt="Boceto" className="w-full h-auto" />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">Cómputo de materiales</h2>
        <ResultTable rows={rows} />
      </section>
    </div>
  );
}
