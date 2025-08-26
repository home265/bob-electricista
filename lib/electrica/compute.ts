// lib/electrica/compute.ts

import type {
  AmpacidadTabla,
  Artefactos,
  Canalizaciones,
  CircuitoIn,
  CircuitoOut,
  CircuitosDefault,
  ElectricaInput,
  ElectricaOutput,
  MetodoAEA,
  RCDConfig,
  TermicasSerie,
  VAKMTabla,
  PuestaTierraConfig,
  AlimentadorOut,
} from "./types";
import type { BOMItem } from "@/lib/types";

function round2(n: number) { return Math.round(n * 100) / 100; }
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function tensionSistema(s: "monofasico_230" | "trifasico_400"): number { return s === "trifasico_400" ? 400 : 230; }

function corrienteDePotencia(P_W: number, sistema: "monofasico_230" | "trifasico_400", pf: number): number {
  const V = tensionSistema(sistema);
  return sistema === "monofasico_230"
    ? P_W / (V * Math.max(0.1, pf))
    : P_W / (Math.sqrt(3) * V * Math.max(0.1, pf));
}

function caidaPorVAKM_pct(I_A: number, seccion_mm2: number, L_m: number, V_A_km_tabla: VAKMTabla, sistema: "monofasico_230" | "trifasico_400"): number {
  const row = V_A_km_tabla.vakm.find(r => r.seccion_mm2 === seccion_mm2);
  if (!row) return Infinity;
  const V_A_km = row.V_A_km;
  const L_km = L_m / 1000;
  const K = sistema === "monofasico_230" ? 2 : Math.sqrt(3);
  const V = tensionSistema(sistema);
  const dV = K * I_A * L_km * V_A_km;
  return (100 * dV) / V;
}

function ampacidad(metodo: MetodoAEA, conductores_cargados: 2 | 3, seccion: number, tabla: AmpacidadTabla): number {
  const serie = tabla.cobre_termoplastica.find(s => s.seccion_mm2 === seccion);
  if (!serie) return 0;
  const m = serie[metodo];
  if (!m) return 0;
  return (m[String(conductores_cargados) as "2c" | "3c"] ?? 0);
}

function pickSeccion(
  Ib: number,
  caidaMax_pct: number,
  L_m: number,
  sistema: "monofasico_230" | "trifasico_400",
  metodo: MetodoAEA,
  conductores_cargados: 2 | 3,
  seccionMin_mm2: number,
  amp: AmpacidadTabla,
  vakm: VAKMTabla
): { seccion: number; Iz: number; caida_pct: number } {
  const secciones = [...amp.cobre_termoplastica].map(s => s.seccion_mm2).sort((a, b) => a - b);
  for (const s of secciones) {
    if (s < seccionMin_mm2) continue;
    const Iz = ampacidad(metodo, conductores_cargados, s, amp);
    if (Iz <= 0 || Iz + 1e-9 < Ib) continue;
    const dU = caidaPorVAKM_pct(Ib, s, L_m, vakm, sistema);
    if (dU <= caidaMax_pct + 1e-9) return { seccion: s, Iz, caida_pct: dU };
  }
  const sMax = secciones[secciones.length - 1];
  const IzMax = ampacidad(metodo, conductores_cargados, sMax, amp);
  const dUMax = caidaPorVAKM_pct(Ib, sMax, L_m, vakm, sistema);
  return { seccion: sMax, Iz: IzMax, caida_pct: dUMax };
}

function pickMCB(Ib: number, Iz: number, termicas: TermicasSerie): number {
  const sorted = [...termicas.series_MCB_A].sort((a, b) => a - b);
  for (const A of sorted) if (A + 1e-9 >= Ib && A <= Iz + 1e-9) return A;
  for (const A of sorted) if (A + 1e-9 >= Ib) return A;
  return sorted[sorted.length - 1];
}

function sumPotenciaW(c: CircuitoIn, arts: Artefactos): { P_W: number; pf: number } {
  const pf = c.pf ?? arts.pf_default ?? 0.85;
  let P = c.potencia_w ?? 0;
  for (const a of (c.artefactos ?? [])) {
    const base = a.grupo === "iluminacion" ? arts.iluminacion
              : a.grupo === "fijos"        ? arts.fijos
              : arts.tomas;
    const row = base.find(x => x.id === a.id);
    if (row) P += row.W * a.cantidad;
  }
  const k = clamp01(c.simultaneidad ?? 1);
  return { P_W: P * (k || 1), pf };
}

function metodoDeCanalizacion(id: string, canal: Canalizaciones): MetodoAEA {
  const f = canal.formas.find(x => x.id === id);
  return (f?.metodo ?? "B2");
}

function groupInto<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function computeElectrica(
  input: ElectricaInput,
  ctx: {
    ampacidad: AmpacidadTabla;
    vakm_mono: VAKMTabla;
    circuitosDefault: CircuitosDefault;
    canalizaciones: Canalizaciones;
    termicas: TermicasSerie;
    rcd: RCDConfig;
    artefactos: Artefactos;
    puestaTierra?: PuestaTierraConfig;
  }
): ElectricaOutput {
  const warnings: string[] = [];
  const outs: CircuitoOut[] = [];
  const bomTmp: BOMItem[] = [];

  const includePE = input.opciones?.incluir_conductor_pe ?? true;
  const groupSize = input.opciones?.agrupar_circuitos_por_id30mA ?? 4;
  const includeS = input.opciones?.incluir_id_aguas_arriba ?? true;

  // ======== CIRCUITOS ========
  for (const c of input.circuitos) {
    const sist = c.tension ?? input.sistema;
    const V = tensionSistema(sist);
    const metodo = metodoDeCanalizacion(c.canalizacionId, ctx.canalizaciones);
    const cargados: 2 | 3 = (c.conductores_cargados ?? (sist === "trifasico_400" ? 3 : 2)) as 2 | 3;

    const t = ctx.circuitosDefault.tipos.find(t => t.id === c.tipoId);
    if (!t) { warnings.push(`Circuito "${c.nombre ?? c.id}" con tipoId desconocido: ${c.tipoId}`); continue; }

    const { P_W, pf } = sumPotenciaW(c, ctx.artefactos);
    const Ib = corrienteDePotencia(P_W, sist, pf);

    let picked = pickSeccion(Ib, t.caida_max_pct, c.longitud_m, sist, metodo, cargados, t.seccion_min_mm2, ctx.ampacidad, ctx.vakm_mono);

    let MCB = pickMCB(Ib, picked.Iz, ctx.termicas);
    if (MCB > picked.Iz + 1e-9) {
      const secs = [...ctx.ampacidad.cobre_termoplastica].map(s => s.seccion_mm2).sort((a, b) => a - b);
      let idx = secs.findIndex(s => s === picked.seccion);
      while (idx < secs.length - 1 && MCB > picked.Iz + 1e-9) {
        idx++;
        const sec = secs[idx];
        const Iz2 = ampacidad(metodo, cargados, sec, ctx.ampacidad);
        const dU2 = caidaPorVAKM_pct(Ib, sec, c.longitud_m, ctx.vakm_mono, sist);
        picked = { seccion: sec, Iz: Iz2, caida_pct: dU2 };
      }
      if (MCB > picked.Iz + 1e-9) warnings.push(`Circuito "${c.nombre ?? c.id}": MCB ${MCB}A supera Iz (${round2(picked.Iz)}A).`);
    }

    const ok = picked.caida_pct <= t.caida_max_pct + 1e-9 && MCB <= picked.Iz + 1e-9;
    const motivo = !ok ? (picked.caida_pct > t.caida_max_pct ? `Caída ${round2(picked.caida_pct)}% > ${t.caida_max_pct}%` : `MCB ${MCB}A > Iz ${round2(picked.Iz)}A`) : undefined;

    outs.push({
      id: c.id, nombre: c.nombre, tipoId: c.tipoId,
      V_V: V, L_m: c.longitud_m, metodo, conductores_cargados: cargados,
      P_W: round2(P_W), pf: round2(pf), Ib_A: round2(Ib),
      seccion_mm2: picked.seccion, Iz_A: round2(picked.Iz), MCB_A: MCB,
      caida_pct: round2(picked.caida_pct), caida_max_pct: t.caida_max_pct, ok, motivo,
    });

    const nCond = (cargados + (includePE ? 1 : 0));
    bomTmp.push({ code: `CU-${nCond}x${picked.seccion}mm2-${metodo}`, desc: `Cable Cu ${nCond}x${picked.seccion} mm² (${metodo})`, qty: Math.ceil(c.longitud_m), unidad: "m" });
    bomTmp.push({ code: `MCB-${MCB}A-C`, desc: `Interruptor termo-magnético ${MCB}A curva C`, qty: 1, unidad: "unidad" });
  }

  // ===== RCDs (30 mA por grupos) + aguas arriba selectivo =====
  if (outs.length > 0) {
    const grupos = groupInto(outs, Math.max(1, groupSize));
    for (let i = 0; i < grupos.length; i++) {
      bomTmp.push({ code: `ID-30mA-A`, desc: `Interruptor diferencial 30 mA tipo ${ctx.rcd.default_terminal.tipo} (grupo ${i + 1}, ${grupos[i].length} circ.)`, qty: 1, unidad: "unidad" });
    }
    if (includeS && ctx.rcd.aguas_arriba) {
      const up = ctx.rcd.aguas_arriba;
      bomTmp.push({ code: `ID-${up.I_dn_mA}mA-${up.tipo}-S`, desc: `Interruptor diferencial ${up.I_dn_mA} mA tipo ${up.tipo} selectivo (aguas arriba)`, qty: 1, unidad: "unidad" });
    }
  }

  // ======== ALIMENTADOR / ACOMETIDA (opcional) ========
  let alimentadorOut: AlimentadorOut | undefined;
  if (input.alimentador?.habilitar) {
    const a = input.alimentador;
    const sist = input.sistema;
    const V = tensionSistema(sist);
    const metodo = metodoDeCanalizacion(a.canalizacionId, ctx.canalizaciones);
    const cargados: 2 | 3 = (sist === "trifasico_400" ? 3 : 2);
    const kDemanda = clamp01(a.demanda_global ?? 0.8);
    const pf_g = a.pf_global ?? 0.9;
    const caidaMax = a.caida_max_pct ?? 2;

    // Potencia total: suma de P_W de circuitos (antes de Ib y simultaneidades propias ya están dentro de cada sum)
    const Ptotal = outs.reduce((acc, c) => acc + c.P_W, 0) * kDemanda;
    const Ib = corrienteDePotencia(Ptotal, sist, pf_g);

    // Sección mínima razonable para alimentador (cobre): 6 mm²
    let picked = pickSeccion(Ib, caidaMax, a.distancia_m, sist, metodo, cargados, 6, ctx.ampacidad, ctx.vakm_mono);
    let MCB = pickMCB(Ib, picked.Iz, ctx.termicas);
    if (MCB > picked.Iz + 1e-9) {
      const secs = [...ctx.ampacidad.cobre_termoplastica].map(s => s.seccion_mm2).sort((a, b) => a - b);
      let idx = secs.findIndex(s => s === picked.seccion);
      while (idx < secs.length - 1 && MCB > picked.Iz + 1e-9) {
        idx++;
        const sec = secs[idx];
        const Iz2 = ampacidad(metodo, cargados, sec, ctx.ampacidad);
        const dU2 = caidaPorVAKM_pct(Ib, sec, a.distancia_m, ctx.vakm_mono, sist);
        picked = { seccion: sec, Iz: Iz2, caida_pct: dU2 };
      }
    }

    const ok = picked.caida_pct <= caidaMax + 1e-9 && MCB <= picked.Iz + 1e-9;
    const motivo = !ok ? (picked.caida_pct > caidaMax ? `Caída ${round2(picked.caida_pct)}% > ${caidaMax}%` : `MCB ${MCB}A > Iz ${round2(picked.Iz)}A`) : undefined;

    // BOM alimentador (incluye PE)
    const nCond = cargados + (input.opciones?.incluir_conductor_pe ?? true ? 1 : 0);
    const isSintenax = a.canalizacionId === "enterrada_directa";
    bomTmp.push({
      code: `ALIM-${nCond}x${picked.seccion}mm2-${metodo}`,
      desc: `${isSintenax ? "Cable directo enterrado (tipo Sintenax)" : "Cable Cu"} ${nCond}x${picked.seccion} mm² (${metodo})`,
      qty: Math.ceil(a.distancia_m),
      unidad: "m",
    });

    const polos = (sist === "trifasico_400" ? 4 : 2);
    bomTmp.push({
      code: `IGA-${polos}P-${MCB}A`,
      desc: `Interruptor general ${polos} polos ${MCB}A (curva C)`,
      qty: 1,
      unidad: "unidad",
    });

    alimentadorOut = {
      V_V: V, L_m: a.distancia_m, metodo, conductores: cargados,
      P_W: round2(Ptotal), pf: round2(pf_g), Ib_A: round2(Ib),
      seccion_mm2: picked.seccion, Iz_A: round2(picked.Iz), MCB_A: MCB,
      caida_pct: round2(picked.caida_pct), caida_max_pct: caidaMax,
      ok, motivo,
      cable_desc: isSintenax ? "Directo enterrado (Sintenax)" : "Cu en canalización"
    };
  }

  // ===== BOM agregado =====
  const bomAgg = aggregateBOM(bomTmp);

  return {
    circuitos: outs,
    alimentador: alimentadorOut,
    bom: bomAgg,
    warnings,
    puesta_tierra: ctx.puestaTierra,
  };
}

/* ===== Helpers ===== */
function aggregateBOM(items: BOMItem[]): BOMItem[] {
  const map = new Map<string, BOMItem>();
  for (const i of items) {
    const key = [i.code, i.unidad ?? ""].join("|");
    const prev = map.get(key);
    if (prev) map.set(key, { ...prev, qty: prev.qty + i.qty });
    else map.set(key, { ...i });
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}
