// lib/electrica/types.ts
import type { BOMItem } from "@/lib/types";

export type MetodoAEA = "B2" | "D1" | "D2";

export interface AmpacidadSerie {
  seccion_mm2: number;
  B2?: { "2c"?: number; "3c"?: number };
  D1?: { "2c"?: number; "3c"?: number };
  D2?: { "2c"?: number; "3c"?: number };
}
export interface AmpacidadTabla {
  fuente: string;
  nota?: string;
  metodos: Record<MetodoAEA, { descripcion: string }>;
  cobre_termoplastica: AmpacidadSerie[];
}

export interface VAKMRow { seccion_mm2: number; V_A_km: number; }
export interface VAKMTabla { fuente: string; vakm: VAKMRow[]; }

export interface CircuitoTipo {
  id: string;
  nombre: string;
  caida_max_pct: number;
  seccion_min_mm2: number;
  motor?: boolean;
}
export interface CircuitosDefault { tipos: CircuitoTipo[]; }

export interface RCDConfig {
  default_terminal: { I_dn_mA: number; tipo: "AC" | "A" | "B" | "F"; selectivo: boolean; nota?: string };
  aguas_arriba?:     { I_dn_mA: number; tipo: "AC" | "A" | "B" | "F"; selectivo: boolean; nota?: string };
}

export interface Artefacto { id: string; nombre: string; W: number; }
export interface Artefactos {
  iluminacion: Artefacto[];
  tomas: Artefacto[];
  fijos: Artefacto[];
  pf_default: number;
}

export interface CanalizacionForma { id: string; nombre: string; metodo: MetodoAEA; }
export interface Canalizaciones { formas: CanalizacionForma[]; }

export interface PuestaTierraConfig { ra_max_ohm: number; nota?: string; irams?: string[]; }

export interface TermicasSerie { series_MCB_A: number[]; curva_default: string; }

export type SistemaElectrico = "monofasico_230" | "trifasico_400";

export interface CircuitoIn {
  id: string;
  nombre?: string;
  tipoId: string;
  ambiente?: string;             // NUEVO: para agrupar y entendible por usuarios
  tension?: SistemaElectrico;
  longitud_m: number;
  canalizacionId: string;
  conductores_cargados?: 2 | 3;
  potencia_w?: number;
  artefactos?: Array<{ id: string; cantidad: number; grupo?: "iluminacion" | "tomas" | "fijos" }>;
  pf?: number;
  simultaneidad?: number;
  seccion_manual_mm2?: number;   // modo experto
}

export interface AlimentadorIn {
  habilitar: boolean;
  distancia_m: number;
  canalizacionId: string;
  caida_max_pct?: number;
  demanda_global?: number;
  pf_global?: number;
}

export interface ElectricaInput {
  sistema: SistemaElectrico;
  circuitos: CircuitoIn[];
  alimentador?: AlimentadorIn;
  opciones?: {
    agrupar_circuitos_por_id30mA?: number;
    incluir_id_aguas_arriba?: boolean;
    incluir_conductor_pe?: boolean;
  };
}

export interface CircuitoOut {
  id: string;
  nombre?: string;
  tipoId: string;
  V_V: number;
  L_m: number;
  metodo: MetodoAEA;
  conductores_cargados: 2 | 3;
  P_W: number;
  pf: number;
  Ib_A: number;
  seccion_mm2: number;
  Iz_A: number;
  MCB_A: number;
  caida_pct: number;
  caida_max_pct: number;
  ok: boolean;
  motivo?: string;
}

export interface AlimentadorOut {
  V_V: number; L_m: number; metodo: MetodoAEA; conductores: number;
  P_W: number; pf: number; Ib_A: number;
  seccion_mm2: number; Iz_A: number; MCB_A: number;
  caida_pct: number; caida_max_pct: number;
  ok: boolean; motivo?: string; cable_desc: string;
}

export interface ElectricaOutput {
  circuitos: CircuitoOut[];
  alimentador?: AlimentadorOut;
  bom: BOMItem[];
  warnings: string[];
  puesta_tierra?: PuestaTierraConfig;
}
