// app/proyecto/[id]/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ResultTable from "@/components/ui/ResultTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getProject, removePartidaById } from "@/lib/project/storage";
import { aggregateMaterialsFromProject } from "@/lib/project/compute";
import type { Project } from "@/lib/project/types";

export default function ProyectoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  
  const [p, setP] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
        setLoading(true);
        const projectData = await getProject(id);
        setP(projectData);
        setLoading(false);
    };
    fetchProject();
  }, [id]);

  const rows = useMemo(() => (p ? aggregateMaterialsFromProject(p) : []), [p]);
  const safeName = useMemo(() => (p ? p.name.replace(/[^\w\-]+/g, "_").toLowerCase() : "proyecto"), [p]);

  async function handleDownloadPdf() {
    if (!p) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Resumen de Proyecto Eléctrico", 14, 22);
    doc.setFontSize(12);
    doc.text(p.name, 14, 32);
    
    autoTable(doc, {
      startY: 45,
      head: [['Material', 'Cantidad', 'Unidad']],
      body: rows.map(m => [m.label, m.qty.toLocaleString('es-AR'), m.unit]),
      theme: 'grid',
      headStyles: { fillColor: [46, 79, 79] },
    });

    doc.save(`proyecto_${safeName}.pdf`);
  }
  
  async function onDeletePartida(partidaId: string) {
      if (!p) return;
      await removePartidaById(p.id, partidaId);
      // Actualizamos el estado local para reflejar el cambio
      setP(currentProject => {
          if (!currentProject) return undefined;
          return {
              ...currentProject,
              partes: currentProject.partes.filter(part => part.id !== partidaId)
          };
      });
  }


  if (loading) return <p className="text-sm text-center p-8">Cargando proyecto...</p>;
  if (!p) return <p className="text-sm text-center p-8">No se encontró el proyecto.</p>;

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 className="text-2xl font-semibold">{p.name}</h1>
            <div className="text-sm text-foreground/60">
            Actualizado: {new Date(p.updatedAt).toLocaleDateString()}
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <Link className="btn btn-secondary" href={`/proyecto/${p.id}/export`}>
              Vista Previa
            </Link>
            <button className="btn btn-primary" onClick={handleDownloadPdf}>
              Descargar PDF
            </button>
        </div>
      </section>

      {p.sketch?.pngDataUrl && (
        <section className="card p-4">
          <h2 className="font-medium mb-3">Boceto Eléctrico</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <img src={p.sketch.pngDataUrl} alt="Boceto del proyecto" className="w-full h-auto" />
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Columna Izquierda: Partidas del Proyecto */}
        <div className="card p-4">
            <h2 className="font-medium mb-3">Partidas del Proyecto</h2>
            {p.partes.length === 0 ? (
                <p className="text-sm text-foreground/60">Aún no se ha guardado ningún cálculo.</p>
            ) : (
                <ul className="space-y-2">
                {p.partes.map(part => (
                    <li key={part.id} className="border border-border rounded p-3 flex justify-between items-center gap-2">
                    <div>
                        <div className="text-sm font-medium">{part.title}</div>
                        <div className="text-xs text-foreground/70 uppercase">{part.kind.replace("_", " ")}</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Link href={`/proyecto/${p.id}/calculo`} className="btn btn-secondary text-xs px-3 py-1">
                            Editar
                        </Link>
                        <ConfirmDialog 
                            onConfirm={() => onDeletePartida(part.id)}
                            message={`¿Eliminar la partida "${part.title}"?`}
                            className="btn btn-ghost text-xs px-3 py-1"
                        >
                            X
                        </ConfirmDialog>
                    </div>
                    </li>
                ))}
                </ul>
            )}
        </div>

        {/* Columna Derecha: Resumen de Materiales */}
        <div className="card p-4">
            <h2 className="font-medium mb-3">Resumen de Materiales</h2>
            {rows.length > 0 ? (
                <ResultTable rows={rows} />
            ) : (
                <p className="text-sm text-foreground/60">Sin materiales aún.</p>
            )}
        </div>
      </div>
    </div>
  );
}