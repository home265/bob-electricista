"use client";
import type { MaterialRow } from "@/lib/project/types";

export default function ResultTable({ rows }: { rows: MaterialRow[] }) {
  if (!rows?.length) {
    return <p className="text-sm text-gray-500">Sin materiales cargados.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Item</th>
            <th className="text-right px-3 py-2">Cantidad</th>
            <th className="text-left px-3 py-2">Unidad</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key ?? `${r.label}-${i}`} className="border-t">
              <td className="px-3 py-2">{r.label}</td>
              <td className="px-3 py-2 text-right">{r.qty}</td>
              <td className="px-3 py-2">{r.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
