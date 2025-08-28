export type MaterialUnit =
  | "u" | "m" | "m2" | "m3" | "kg" | "l" | "cm" | "mm";

export interface MaterialRow {
  key?: string;
  label: string;
  qty: number;
  unit: MaterialUnit;
}

export type PartidaKind = "electricidad" | "custom";

export interface Partida {
  id: string;
  title: string;
  kind: PartidaKind;
  inputs: unknown;   // estructura propia de Electricidad (no se toca)
  outputs: unknown;  // resultados técnicos de Electricidad (no se toca)
  materials: MaterialRow[];
  createdAt: number;
  updatedAt: number;
}

export interface SketchData {
  json?: unknown;        // datos editables del boceto
  pngDataUrl?: string;   // previsualización para resumen/export
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  siteAddress?: string;
  partes: Partida[];
  sketch?: SketchData;
  createdAt: number;
  updatedAt: number;
}
