import type { MaterialRow, Project } from "./types";
import { normalizeLabel } from "./helpers";

export function aggregateMaterialsFromRows(rows: MaterialRow[]): MaterialRow[] {
  const acc = new Map<string, MaterialRow>();
  for (const r of rows) {
    const key = `${normalizeLabel(r.label)}|${r.unit}`;
    const prev = acc.get(key);
    if (!prev) {
      acc.set(key, { ...r, label: normalizeLabel(r.label) });
    } else {
      acc.set(key, { ...prev, qty: prev.qty + r.qty });
    }
  }
  // opcional: redondeo a 3 decimales para evitar flotantes
  return Array.from(acc.values()).map((r) => ({
    ...r,
    qty: Math.round((r.qty + Number.EPSILON) * 1000) / 1000,
  }));
}

export function aggregateMaterialsFromProject(p: Project): MaterialRow[] {
  const rows = p.partes.flatMap((pt) => pt.materials || []);
  return aggregateMaterialsFromRows(rows);
}
