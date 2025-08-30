// app/proyecto/[id]/export/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject } from "@/lib/project/storage";
import { aggregateMaterialsFromProject } from "@/lib/project/compute";
import type { Project } from "@/lib/project/types";

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [p, setP] = useState<Project | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getProject(id).then(setP);
  }, [id]);

  const rows = useMemo(() => (p ? aggregateMaterialsFromProject(p) : []), [p]);
  const date = new Date().toLocaleDateString("es-AR", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  function onPrint() {
    window.print();
  }

  if (!p) return <p className="text-sm text-center p-8">Cargando...</p>;

  return (
    <div className="mx-auto max-w-4xl p-8 print:p-0 bg-white text-gray-800 font-sans">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: #ffffff !important; 
            color: #111827 !important; 
          }
          @page { 
            size: A4; 
            margin: 1.5cm; 
          }
        }
        .header-title { font-size: 24px; font-weight: 700; color: #1a202c; }
        .project-details { color: #4a5568; }
        .section-title { 
          font-size: 18px; 
          font-weight: 600; 
          margin-top: 2rem; 
          margin-bottom: 0.5rem; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 0.25rem; 
          color: #2d3748;
        }
        .materials-table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px; 
        }
        .materials-table th, .materials-table td { 
          padding: 8px 4px; 
          text-align: left;
        }
        .materials-table thead th { 
          color: #718096; 
          border-bottom: 1px solid #cbd5e0; 
          font-weight: 600;
        }
        .materials-table tbody tr:nth-child(even) { 
          background-color: #f7fafc; 
        }
        .materials-table .text-right {
          text-align: right;
        }
        .footer-note { 
          margin-top: 3rem; 
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          font-size: 10px; 
          color: #a0aec0; 
          text-align: center; 
        }
      `}</style>

      <div className="no-print mb-6 flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
        >
          ← Volver
        </button>
        <button 
          onClick={onPrint} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Imprimir
        </button>
      </div>
      
      <header className="mb-8">
        <h1 className="header-title">{p.name}</h1>
        <div className="project-details mt-2 space-y-1">
          {p.client && <div><strong>Cliente:</strong> {p.client}</div>}
          {p.siteAddress && <div><strong>Obra:</strong> {p.siteAddress}</div>}
          <div><strong>Fecha de Emisión:</strong> {date}</div>
        </div>
      </header>

      {p.sketch?.pngDataUrl && (
        <section className="mb-8">
          <h2 className="section-title">Boceto</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img src={p.sketch.pngDataUrl} alt="Boceto" className="w-full h-auto" />
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Resumen de Materiales</h2>
        <table className="materials-table">
          <thead>
            <tr>
              <th>Material</th>
              <th className="text-right">Cantidad</th>
              <th style={{ paddingLeft: '1rem' }}>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.key ?? r.label}-${i}`}>
                <td>{r.label}</td>
                <td className="text-right">{r.qty.toLocaleString('es-AR')}</td>
                <td style={{ paddingLeft: '1rem' }}>{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <footer className="footer-note">
        <p>Documento generado por Bob Electricista. Los cálculos son una estimación y deben ser verificados por un profesional.</p>
      </footer>
    </div>
  );
}