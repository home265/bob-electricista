"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getProject, exportCSV } from "@/lib/project/storage";
import { aggregateMaterialsFromProject } from "@/lib/project/compute";
import type { Project } from "@/lib/project/types";

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [p, setP] = useState<Project | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getProject(id).then(setP);
  }, [id]);

  const rows = useMemo(() => (p ? aggregateMaterialsFromProject(p) : []), [p]);

  async function onPrint() {
    window.print();
  }

  async function onDownloadCSV() {
    if (!id) return;
    const csv = await exportCSV(id);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p?.name ?? "proyecto"}-materiales.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!p) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between print-hidden">
        <h1 className="text-xl font-semibold">{p.name}</h1>
        <div className="flex gap-2">
          <button onClick={onDownloadCSV} className="btn">Descargar CSV</button>
          <button onClick={onPrint} className="btn">Imprimir</button>
        </div>
      </section>

      {p.sketch?.pngDataUrl && (
        <section>
          <h2 className="font-semibold print-hidden">Boceto</h2>
          <img src={p.sketch.pngDataUrl} alt="Boceto" className="w-full h-auto rounded-lg border-border border" />
        </section>
      )}

      <section>
        <h2 className="font-semibold print-hidden">Cómputo de materiales</h2>
        <table className="table">
          <thead className="print-hidden">
            <tr>
              <th>Material</th>
              <th className="text-right">Cantidad</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.label}-${i}`}>
                <td>{r.label}</td>
                <td className="text-right">{r.qty}</td>
                <td>{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
