// Tipos compartidos por toda la app (Agua / Sanitaria / Eléctrica)

export interface BOMItem {
  code: string;      // código de compra
  desc: string;      // descripción
  qty: number;       // cantidad
  unidad?: string;   // "m", "barra", "unidad", etc.
  dn_mm?: number;    // diámetro nominal en mm (cuando aplica)
}

/* ===== Proyecto ===== */
export type PartidaKind = "agua" | "sanitaria" | "electrica";

export interface Partida {
  id: string;
  kind: PartidaKind;
  summary: string;
  params: any;          // parámetros de entrada (se guardan para trazabilidad)
  result: any;          // resultado crudo del motor (para reimprimir)
  bom: BOMItem[];       // BOM de esta partida
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  partidas: Partida[];
}

/* ===== Sanitaria ===== */
export interface PendientePorDN {
  dn_mm: number;
  min: number;     // cm/m
  recom: number;   // cm/m
  max: number;     // cm/m
}

export interface SanitariaCatalog {
  pipes: Array<{ dn_mm: number; barra_m: number }>;
  fittings: Array<{ tipo: "codo90" | "codo45" | "tee"; dn_mm: number; code: string }>;
  insumos: Array<{
    tipo: "pegamento_pvc" | "limpiador_pvc" | "junta_elastica";
    code: string;
    dn_mm?: number;
  }>;
}

/* ===== Agua ===== */
export type UnidadesConsumo = Record<string, number>; // p.ej. { ducha: 1.5, lavatorio: 1, ... }
