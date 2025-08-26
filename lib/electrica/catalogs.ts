// lib/electrica/catalogs.ts
// Carga de JSON desde public/data/electrica/*

import type {
  AmpacidadTabla,
  VAKMTabla,
  CircuitosDefault,
  RCDConfig,
  Artefactos,
  Canalizaciones,
  PuestaTierraConfig,
  TermicasSerie,
} from "./types";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return res.json() as Promise<T>;
}

export async function getAmpacidad(): Promise<AmpacidadTabla> {
  return fetchJSON<AmpacidadTabla>("/data/electrica/ampacidad_cobre_aea_770.12.III.json");
}
export async function getVAKM_Monofasico(): Promise<VAKMTabla> {
  return fetchJSON<VAKMTabla>("/data/electrica/caida_vakm_monofasico.json");
}
export async function getCircuitosDefault(): Promise<CircuitosDefault> {
  return fetchJSON<CircuitosDefault>("/data/electrica/circuitos_default.json");
}
export async function getRCDConfig(): Promise<RCDConfig> {
  return fetchJSON<RCDConfig>("/data/electrica/rcd.json");
}
export async function getArtefactos(): Promise<Artefactos> {
  return fetchJSON<Artefactos>("/data/electrica/artefactos_basicos.json");
}
export async function getCanalizaciones(): Promise<Canalizaciones> {
  return fetchJSON<Canalizaciones>("/data/electrica/canalizaciones.json");
}
export async function getPuestaTierra(): Promise<PuestaTierraConfig> {
  return fetchJSON<PuestaTierraConfig>("/data/electrica/puesta_tierra.json");
}
export async function getTermicasSerie(): Promise<TermicasSerie> {
  return fetchJSON<TermicasSerie>("/data/electrica/series_termicas.json");
}

/** Carga todo lo necesario en paralelo */
export async function getElectricaContext() {
  const [
    ampacidad,
    vakm_mono,
    circuitosDefault,
    rcd,
    artefactos,
    canalizaciones,
    puestaTierra,
    termicas,
  ] = await Promise.all([
    getAmpacidad(),
    getVAKM_Monofasico(),
    getCircuitosDefault(),
    getRCDConfig(),
    getArtefactos(),
    getCanalizaciones(),
    getPuestaTierra(),
    getTermicasSerie(),
  ]);

  return {
    ampacidad,
    vakm_mono,
    circuitosDefault,
    rcd,
    artefactos,
    canalizaciones,
    puestaTierra,
    termicas,
  };
}
