"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { newId } from "@/lib/id";
import { saveOrUpdateCalculation, getProject } from "@/lib/project/storage";
import { computeElectrica } from "@/lib/electrica/compute";
import { getElectricaContext } from "@/lib/electrica/catalogs";
import type {
  ElectricaInput,
  ElectricaOutput,
  SistemaElectrico,
  CircuitoIn,
  Artefactos as ArtefactsType,
  AmpacidadTabla,
  VAKMTabla,
  CircuitosDefault,
  Canalizaciones,
  TermicasSerie,
  RCDConfig,
  PuestaTierraConfig,
} from "@/lib/electrica/types";

import AyudanteCaida from "@/components/electrica/AyudanteCaida";
import type { MaterialRow, MaterialUnit } from "@/lib/project/types";

type CanalId = string;
type TipoCircuitoId = string;
type Grupo = "iluminacion" | "tomas" | "fijos";

interface ArteSel { id: string; grupo: Grupo; articuloId: string; cantidad: number; }

interface CircuitoForm {
  id: string;
  nombre: string;
  ambiente?: string;
  tipoId: TipoCircuitoId;
  longitud_m: number;
  canalizacionId: CanalId;

  modo: "potencia" | "artefactos";
  potencia_w: number;
  artefactos: ArteSel[];

  pf?: number;
  simultaneidad?: number;

  // Modo experto
  seccionModo: "auto" | "manual";
  seccionManual_mm2?: number;
}

interface PresetDef {
  id: string;
  nombre: string;
  sistema: SistemaElectrico;
  circuitos: Array<Omit<CircuitoForm, "id" | "artefactos" | "seccionModo"> & { artefactos?: never; seccionModo?: never }>;
}

interface AmpacidadEntry { seccion_mm2: number }
interface TipoDef { id: string; nombre: string; caida_max_pct: number; seccion_min_mm2: number }
interface Forma { id: string; nombre: string }
interface ElectricaContext {
  ampacidad: AmpacidadTabla;
  vakm_mono: VAKMTabla;
  circuitosDefault: CircuitosDefault;
  canalizaciones: Canalizaciones;
  termicas: TermicasSerie;
  rcd: RCDConfig;
  artefactos: ArtefactsType;
  puestaTierra?: PuestaTierraConfig;
}


export default function ElectricaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [ready, setReady] = useState(false);
  const [ctx, setCtx] = useState<ElectricaContext | null>(null);

  const [sistema, setSistema] = useState<SistemaElectrico>("monofasico_230");
  const [circuitos, setCircuitos] = useState<CircuitoForm[]>([
    { id: newId("circ"), nombre: "Iluminación PB", ambiente: "Planta Baja", tipoId: "iluminacion", longitud_m: 25, canalizacionId: "embutida", modo: "potencia", potencia_w: 300, artefactos: [], pf: 0.95, simultaneidad: 1, seccionModo: "auto" }
  ]);

  const [presets, setPresets] = useState<PresetDef[]>([]);
  const ambientesBase = ["General","Cocina","Dormitorio","Dormitorios","Living","Comedor","Baño","Lavadero","Técnico","Planta Baja","Planta Alta"];

  // Alimentador
  const [alimOn, setAlimOn] = useState(true);
  const [alimDist, setAlimDist] = useState(15);
  const [alimCanal, setAlimCanal] = useState<CanalId>("aereo");
  const [alimCaida, setAlimCaida] = useState(2);
  const [alimDemanda, setAlimDemanda] = useState(0.8);
  const [alimPf, setAlimPf] = useState(0.9);

  useEffect(() => { (async () => {
    const context = await getElectricaContext() as unknown as ElectricaContext;
    setCtx(context);
    try {
      const resp = await fetch("/data/electrica/presets.json", { cache: "no-store" });
      if (resp.ok) {
        const j = await resp.json();
        setPresets(j.presets || []);
      }
    } catch {}
    setReady(true);
  })(); }, []);

  useEffect(() => {
    (async () => {
      const prj = await getProject(projectId);
      if (!prj) router.replace("/proyecto");
    })();
  }, [projectId, router]);

  function updateCircuito(id: string, patch: Partial<CircuitoForm>) { setCircuitos(cs => cs.map(c => (c.id === id ? { ...c, ...patch } : c))); }
  function addCircuito() {
    setCircuitos(cs => [...cs, { id: newId("circ"), nombre: `Circuito ${cs.length + 1}`, ambiente: "General", tipoId: "tug", longitud_m: 18, canalizacionId: "embutida", modo: "potencia", potencia_w: 1200, artefactos: [], pf: 0.9, simultaneidad: 0.6, seccionModo: "auto" }]);
  }
  function removeCircuito(id: string) { setCircuitos(cs => cs.filter(c => c.id !== id)); }
  function dupCircuito(id: string) {
    setCircuitos(cs => {
      const idx = cs.findIndex(x => x.id === id);
      if (idx < 0) return cs;
      const base = cs[idx];
      const copy: CircuitoForm = { ...base, id: newId("circ"), nombre: `${base.nombre} (copia)` };
      return [...cs.slice(0, idx + 1), copy, ...cs.slice(idx + 1)];
    });
  }
  function moveCircuito(id: string, dir: -1 | 1) {
    setCircuitos(cs => {
      const idx = cs.findIndex(x => x.id === id);
      if (idx < 0) return cs;
      const j = idx + dir;
      if (j < 0 || j >= cs.length) return cs;
      const arr = [...cs];
      const [it] = arr.splice(idx, 1);
      arr.splice(j, 0, it);
      return arr;
    });
  }

  function addArtefactoRow(cid: string) { setCircuitos(cs => cs.map(c => c.id !== cid ? c : { ...c, artefactos: [...c.artefactos, { id: newId("art"), grupo: "iluminacion", articuloId: "", cantidad: 1 }] })); }
  function updateArtefactoRow(cid: string, rid: string, patch: Partial<ArteSel>) { setCircuitos(cs => cs.map(c => c.id !== cid ? c : { ...c, artefactos: c.artefactos.map(a => a.id === rid ? { ...a, ...patch } : a) })); }
  function removeArtefactoRow(cid: string, rid: string) { setCircuitos(cs => cs.map(c => c.id !== cid ? c : { ...c, artefactos: c.artefactos.filter(a => a.id !== rid) })); }

  function potenciaArtefactos(c: CircuitoForm): number {
    if (!ctx) return 0;
    const arts: ArtefactsType = ctx.artefactos;
    let total = 0;
    for (const a of c.artefactos) {
      const base = a.grupo === "iluminacion" ? arts.iluminacion : a.grupo === "fijos" ? arts.fijos : arts.tomas;
      const row = base.find(x => x.id === a.articuloId);
      if (row) total += (row.W || 0) * (a.cantidad || 0);
    }
    return total;
  }

  const seccionesDisponibles = useMemo<number[]>(() => {
    if (!ctx) return [];
    return [...ctx.ampacidad.cobre_termoplastica].map((s: AmpacidadEntry) => s.seccion_mm2).sort((a: number, b: number) => a - b);
  }, [ctx]);

  const output = useMemo<ElectricaOutput | null>(() => {
    if (!ready || !ctx) return null;
    const entrada: ElectricaInput = {
      sistema,
      circuitos: circuitos.map<CircuitoIn>(c => ({
        id: c.id, nombre: c.nombre, tipoId: c.tipoId, ambiente: c.ambiente, longitud_m: Number(c.longitud_m || 0), canalizacionId: c.canalizacionId,
        potencia_w: c.modo === "potencia" ? Number(c.potencia_w || 0) : 0,
        artefactos: c.modo === "artefactos" ? c.artefactos.filter(a => a.articuloId && a.cantidad > 0).map(a => ({ id: a.articuloId, cantidad: a.cantidad, grupo: a.grupo })) : undefined,
        pf: c.pf != null ? Number(c.pf) : undefined,
        simultaneidad: c.simultaneidad != null ? Math.max(0, Math.min(1, Number(c.simultaneidad))) : undefined,
        seccion_manual_mm2: c.seccionModo === "manual" ? c.seccionManual_mm2 : undefined
      })),
      alimentador: alimOn ? {
        habilitar: true, distancia_m: Number(alimDist || 0), canalizacionId: alimCanal,
        caida_max_pct: Number(alimCaida || 2), demanda_global: Number(alimDemanda || 0.8), pf_global: Number(alimPf || 0.9)
      } : undefined,
      opciones: { agrupar_circuitos_por_id30mA: 4, incluir_id_aguas_arriba: true, incluir_conductor_pe: true }
    };
    return computeElectrica(entrada, ctx);
  }, [ready, ctx, sistema, circuitos, alimOn, alimDist, alimCanal, alimCaida, alimDemanda, alimPf]);

  function handleAddToProject() {
    if (!output) return;

    const summary = `Eléctrica • ${circuitos.length} circ • ${sistema === "monofasico_230" ? "Mono 230" : "Tri 400"}${alimOn ? " • Alimentador" : ""}`;

    const entrada = {
      sistema,
      circuitos: circuitos.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        ambiente: c.ambiente,
        tipoId: c.tipoId,
        longitud_m: Number(c.longitud_m || 0),
        canalizacionId: c.canalizacionId,
        modo: c.modo,
        potencia_w: Number(c.potencia_w || 0),
        artefactos: c.artefactos.map((a) => ({ id: a.articuloId, cantidad: a.cantidad, grupo: a.grupo })),
        pf: c.pf,
        simultaneidad: c.simultaneidad,
        seccion_manual_mm2: c.seccionModo === "manual" ? c.seccionManual_mm2 : undefined,
      })),
      alimentador: alimOn
        ? {
            habilitar: true,
            distancia_m: Number(alimDist || 0),
            canalizacionId: alimCanal,
            caida_max_pct: Number(alimCaida || 2),
            demanda_global: Number(alimDemanda || 0.8),
            pf_global: Number(alimPf || 0.9),
          }
        : undefined,
      opciones: { agrupar_circuitos_por_id30mA: 4, incluir_id_aguas_arriba: true, incluir_conductor_pe: true },
    };

    const materials: MaterialRow[] = (output.bom ?? []).map((b) => ({
  label: b.desc,
  qty: Number(b.qty || 0),
  unit: (b.unidad ?? "u") as MaterialUnit,
}));


    saveOrUpdateCalculation(projectId, {
      title: summary,
      inputs: entrada,
      outputs: output,
      materials,
    }).then(() => {
      alert("Cálculo de Electricidad guardado en el proyecto.");
    });
  }

  function applyPreset(presetId: string) {
    const p = presets.find(x => x.id === presetId);
    if (!p) return;
    setSistema(p.sistema);
    setCircuitos(p.circuitos.map(() => ({
      id: newId("circ"),
      nombre: "Circuito",
      ambiente: "General",
      tipoId: "tug",
      longitud_m: 10,
      canalizacionId: "embutida",
      modo: "potencia",
      potencia_w: 0,
      artefactos: [],
      pf: undefined,
      simultaneidad: undefined,
      seccionModo: "auto"
    })));
  }

  if (!ready || !ctx) return null;

  const tipos: TipoDef[] = ctx.circuitosDefault.tipos;
  const formas: Forma[] = ctx.canalizaciones.formas;
  const arts: ArtefactsType = ctx.artefactos;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Instalación Eléctrica</h1>
        <p className="opacity-80 text-sm">Modo simple con presets y ambientes. Modo experto opcional.</p>
      </header>

      {/* Barra de presets */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="text-sm opacity-80">Sistema</span>
            <select className="px-3 py-2 rounded-xl" value={sistema} onChange={(e) => setSistema(e.target.value as SistemaElectrico)}>
              <option value="monofasico_230">Monofásico 230 V</option>
              <option value="trifasico_400">Trifásico 400 V</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Aplicar preset</span>
            <div className="flex gap-2">
              <select className="px-3 py-2 rounded-xl" onChange={(e) => e.target.value && applyPreset(e.target.value)}>
                <option value="">-- elegir --</option>
                {presets.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
              </select>
              <button className="btn btn-ghost" onClick={() => applyPreset("monoambiente")}>Rápido: Monoambiente</button>
            </div>
          </label>

          <AyudanteCaida sistema={sistema} caidaMaxPct={3} />
        </div>
      </div>

      {/* Alimentador */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Alimentador / Acometida</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={alimOn} onChange={(e) => setAlimOn(e.target.checked)} /> Habilitar dimensionado
          </label>
        </div>
        {alimOn && (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6">
            <label className="flex flex-col"><span className="text-sm opacity-80">Distancia (m)</span>
              <input type="number" step="0.1" className="px-3 py-2 rounded-xl" value={alimDist} onChange={(e) => setAlimDist(Number(e.target.value || 0))} /></label>
            <label className="flex flex-col md:col-span-2"><span className="text-sm opacity-80">Canalización</span>
              <select className="px-3 py-2 rounded-xl" value={alimCanal} onChange={(e) => setAlimCanal(e.target.value as CanalId)}>{formas.map(f => (<option key={f.id} value={f.id}>{f.nombre}</option>))}</select></label>
            <label className="flex flex-col"><span className="text-sm opacity-80">ΔU máx. (%)</span>
              <input type="number" step="0.1" className="px-3 py-2 rounded-xl" value={alimCaida} onChange={(e) => setAlimCaida(Number(e.target.value || 2))} /></label>
            <label className="flex flex-col"><span className="text-sm opacity-80">Demanda global 0..1</span>
              <input type="number" min="0" max="1" step="0.05" className="px-3 py-2 rounded-xl" value={alimDemanda} onChange={(e) => setAlimDemanda(Math.max(0, Math.min(1, Number(e.target.value))))} /></label>
            <label className="flex flex-col"><span className="text-sm opacity-80">cos φ global</span>
              <input type="number" step="0.01" className="px-3 py-2 rounded-xl" value={alimPf} onChange={(e) => setAlimPf(Number(e.target.value || 0.9))} /></label>
          </div>
        )}
      </div>

      {/* Circuitos */}
      <div className="space-y-4">
        {circuitos.map((c, idx) => {
          const P_art = potenciaArtefactos(c);
          return (
            <div key={c.id} className="card p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <input className="px-3 py-2 rounded-xl w-full max-w-sm" value={c.nombre} onChange={(e) => updateCircuito(c.id, { nombre: e.target.value })} placeholder="Nombre del circuito" />
                <div className="flex gap-2">
                  <button className="btn btn-ghost" onClick={() => moveCircuito(c.id, -1)} disabled={idx === 0}>↑</button>
                  <button className="btn btn-ghost" onClick={() => moveCircuito(c.id, +1)} disabled={idx === circuitos.length - 1}>↓</button>
                  <button className="btn btn-ghost" onClick={() => dupCircuito(c.id)}>Duplicar</button>
                  <button className="btn btn-danger" onClick={() => removeCircuito(c.id)}>Quitar</button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                <label className="flex flex-col"><span className="text-sm opacity-80">Ambiente</span>
                  <input className="px-3 py-2 rounded-xl" value={c.ambiente ?? ""} onChange={(e) => updateCircuito(c.id, { ambiente: e.target.value })} list="ambientes-sugeridos" placeholder="Ej: Cocina" />
                  <datalist id="ambientes-sugeridos">
                    {ambientesBase.map(a => <option key={a} value={a} />)}
                  </datalist>
                </label>

                <label className="flex flex-col"><span className="text-sm opacity-80">Tipo</span>
                  <select className="px-3 py-2 rounded-xl" value={c.tipoId} onChange={(e) => updateCircuito(c.id, { tipoId: e.target.value as TipoCircuitoId })}>
                    {tipos.map(t => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
                  </select>
                </label>

                <label className="flex flex-col"><span className="text-sm opacity-80">Longitud (m)</span>
                  <input type="number" step="0.1" className="px-3 py-2 rounded-xl" value={c.longitud_m} onChange={(e) => updateCircuito(c.id, { longitud_m: Number(e.target.value || 0) })} />
                </label>

                <label className="flex flex-col"><span className="text-sm opacity-80">Canalización</span>
                  <select className="px-3 py-2 rounded-xl" value={c.canalizacionId} onChange={(e) => updateCircuito(c.id, { canalizacionId: e.target.value as CanalId })}>
                    {formas.map(f => (<option key={f.id} value={f.id}>{f.nombre}</option>))}
                  </select>
                </label>

                <label className="flex flex-col"><span className="text-sm opacity-80">Modo de carga</span>
                  <select className="px-3 py-2 rounded-xl" value={c.modo} onChange={(e) => updateCircuito(c.id, { modo: e.target.value as "potencia" | "artefactos" })}>
                    <option value="potencia">Potencia directa (W)</option>
                    <option value="artefactos">Por artefactos</option>
                  </select>
                </label>
              </div>

              {c.modo === "potencia" && (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  <label className="flex flex-col"><span className="text-sm opacity-80">Potencia (W)</span>
                    <input type="number" step="1" className="px-3 py-2 rounded-xl" value={c.potencia_w} onChange={(e) => updateCircuito(c.id, { potencia_w: Number(e.target.value || 0) })} />
                  </label>
                  <label className="flex flex-col"><span className="text-sm opacity-80">cos φ</span>
                    <input type="number" step="0.01" className="px-3 py-2 rounded-xl" value={c.pf ?? ""} onChange={(e) => updateCircuito(c.id, { pf: e.target.value === "" ? undefined : Number(e.target.value) })} placeholder="Ej: 0.95" />
                  </label>
                  <label className="flex flex-col"><span className="text-sm opacity-80">Simultaneidad 0..1</span>
                    <input type="number" step="0.05" min="0" max="1" className="px-3 py-2 rounded-xl" value={c.simultaneidad ?? 1} onChange={(e) => updateCircuito(c.id, { simultaneidad: Math.max(0, Math.min(1, Number(e.target.value))) })} />
                  </label>
                </div>
              )}

              {c.modo === "artefactos" && (
                <div className="space-y-3">
                  <div className="text-sm opacity-80">Catálogo de artefactos</div>
                  <div className="space-y-2">
                    {c.artefactos.map((row) => (
                      <div key={row.id} className="grid gap-2 md:grid-cols-5">
                        <label className="flex flex-col"><span className="text-sm opacity-80">Grupo</span>
                          <select className="px-3 py-2 rounded-xl" value={row.grupo} onChange={(e) => updateArtefactoRow(c.id, row.id, { grupo: e.target.value as Grupo, articuloId: "" })}>
                            <option value="iluminacion">Iluminación</option><option value="tomas">Tomas</option><option value="fijos">Fijos</option>
                          </select>
                        </label>
                        <label className="flex flex-col md:col-span-3"><span className="text-sm opacity-80">Artefacto</span>
                          <select className="px-3 py-2 rounded-xl" value={row.articuloId} onChange={(e) => updateArtefactoRow(c.id, row.id, { articuloId: e.target.value })}>
                            <option value="">-- seleccionar --</option>
                            {(row.grupo === "iluminacion" ? arts.iluminacion : row.grupo === "fijos" ? arts.fijos : arts.tomas).map(a => (
                              <option key={a.id} value={a.id}>{a.nombre} ({a.W} W)</option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col"><span className="text-sm opacity-80">Cantidad</span>
                          <input type="number" min="1" step="1" className="px-3 py-2 rounded-xl" value={row.cantidad} onChange={(e) => updateArtefactoRow(c.id, row.id, { cantidad: Math.max(1, Number(e.target.value || 1)) })} />
                        </label>
                        <div className="md:col-span-5"><button className="btn btn-danger" onClick={() => removeArtefactoRow(c.id, row.id)}>Quitar línea</button></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button className="btn" onClick={() => addArtefactoRow(c.id)}>Agregar artefacto</button>
                    <div className="text-sm opacity-80">Potencia por artefactos: <strong>{P_art}</strong> W</div>
                  </div>
                </div>
              )}

              {/* Modo experto */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <label className="flex flex-col"><span className="text-sm opacity-80">Sección (modo)</span>
                  <select className="px-3 py-2 rounded-xl" value={c.seccionModo} onChange={(e) => updateCircuito(c.id, { seccionModo: e.target.value as "auto" | "manual" })}>
                    <option value="auto">Automática</option>
                    <option value="manual">Manual (experto)</option>
                  </select>
                </label>
                {c.seccionModo === "manual" && (
                  <label className="flex flex-col"><span className="text-sm opacity-80">Sección manual (mm²)</span>
                    <select className="px-3 py-2 rounded-xl" value={c.seccionManual_mm2 ?? ""} onChange={(e) => updateCircuito(c.id, { seccionManual_mm2: e.target.value === "" ? undefined : Number(e.target.value) })}>
                      <option value="">-- seleccionar --</option>
                      {seccionesDisponibles.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex gap-2">
          <button className="btn" onClick={addCircuito}>Agregar circuito</button>
        </div>
      </div>

      {/* Resultado */}
      {output && (
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Resultado</h3>

          {/* Alimentador */}
          {output.alimentador && (
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="text-sm opacity-80 mb-1">Alimentador</div>
              <div className="card--table overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left opacity-80"><th className="py-2 pr-4">V</th><th className="py-2 pr-4">L (m)</th><th className="py-2 pr-4">Método</th><th className="py-2 pr-4">Ib (A)</th><th className="py-2 pr-4">Sección</th><th className="py-2 pr-4">Iz</th><th className="py-2 pr-4">IGA</th><th className="py-2 pr-4">ΔU (%)</th><th className="py-2 pr-4">OK</th><th className="py-2 pr-4">Obs.</th></tr></thead>
                  <tbody><tr className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{output.alimentador.V_V}</td>
                    <td className="py-2 pr-4">{output.alimentador.L_m}</td>
                    <td className="py-2 pr-4">{output.alimentador.metodo}</td>
                    <td className="py-2 pr-4">{output.alimentador.Ib_A}</td>
                    <td className="py-2 pr-4">{output.alimentador.seccion_mm2}</td>
                    <td className="py-2 pr-4">{output.alimentador.Iz_A}</td>
                    <td className="py-2 pr-4">{output.alimentador.MCB_A}</td>
                    <td className="py-2 pr-4">{output.alimentador.caida_pct}</td>
                    <td className="py-2 pr-4">{output.alimentador.ok ? "Sí" : "No"}</td>
                    <td className="py-2 pr-4">{output.alimentador.motivo ?? "-"}</td>
                  </tr></tbody>
                </table>
              </div>
            </div>
          )}

          {/* Circuitos */}
          <div className="card--table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4">Ambiente</th>
                  <th className="py-2 pr-4">Circuito</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">V</th>
                  <th className="py-2 pr-4">L (m)</th>
                  <th className="py-2 pr-4">Método</th>
                  <th className="py-2 pr-4">Ib (A)</th>
                  <th className="py-2 pr-4">Sección</th>
                  <th className="py-2 pr-4">Iz</th>
                  <th className="py-2 pr-4">MCB</th>
                  <th className="py-2 pr-4">ΔU (%)</th>
                  <th className="py-2 pr-4">OK</th>
                  <th className="py-2 pr-4">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {output.circuitos.map(s => (
                  <tr key={s.id} className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{(circuitos.find(c => c.id === s.id)?.ambiente) ?? "-"}</td>
                    <td className="py-2 pr-4">{s.nombre || s.id}</td>
                    <td className="py-2 pr-4">{(tipos.find(t => t.id === s.tipoId)?.nombre) ?? s.tipoId}</td>
                    <td className="py-2 pr-4">{s.V_V}</td>
                    <td className="py-2 pr-4">{s.L_m}</td>
                    <td className="py-2 pr-4">{s.metodo}</td>
                    <td className="py-2 pr-4">{s.Ib_A}</td>
                    <td className="py-2 pr-4">{s.seccion_mm2}</td>
                    <td className="py-2 pr-4">{s.Iz_A}</td>
                    <td className="py-2 pr-4">{s.MCB_A}</td>
                    <td className="py-2 pr-4">{s.caida_pct}</td>
                    <td className="py-2 pr-4">{s.ok ? "Sí" : "No"}</td>
                    <td className="py-2 pr-4">{s.motivo ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {output.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-300">
              {output.warnings.map((w, i) => (<li key={i}>{w}</li>))}
            </ul>
          )}

          <div className="flex gap-2 pt-2">
            <button className="btn btn-primary" onClick={handleAddToProject}>Agregar al proyecto</button>
          </div>

          {/* BOM */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Lista de materiales (BOM)</h4>
            <div className="card--table overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left opacity-80"><th className="py-2 pr-4">Código</th><th className="py-2 pr-4">Descripción</th><th className="py-2 pr-4">Cant.</th><th className="py-2 pr-4">Unidad</th></tr></thead>
                <tbody>{output.bom.map((i) => (<tr key={i.code} className="border-t border-[--color-border]"><td className="py-2 pr-4">{i.code}</td><td className="py-2 pr-4">{i.desc}</td><td className="py-2 pr-4">{i.qty}</td><td className="py-2 pr-4">{i.unidad ?? "-"}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
