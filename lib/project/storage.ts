// lib/project/storage.ts
"use client";
import { db } from "../db";
import type { Project, Partida, MaterialRow } from "./types";
import { id as rid } from "@/lib/id"; // Usamos tu función 'id' y la renombramos a 'rid' internamente

/* ---------------------------------- Utils --------------------------------- */

function ensureClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "storage.ts: esta API solo puede usarse en el cliente."
    );
  }
}

/** Ordena proyectos por updatedAt desc */
function sortByUpdatedAtDesc(a: Project, b: Project): number {
  return (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0);
}

/** Normaliza materiales a la forma del DB */
function toDBMaterials(materials: MaterialRow[]): MaterialRow[] {
  return materials.map(m => ({
    label: m.label,
    qty: m.qty,
    unit: m.unit,
    key: m.key
  }));
}

/* ------------------------------ Proyectos CRUD ----------------------------- */

export async function listProjects(): Promise<Project[]> {
  ensureClient();
  const rows = await db.projects.toArray();
  return rows.sort(sortByUpdatedAtDesc);
}

export async function createProject(input: {
  name: string;
  client?: string;
  siteAddress?: string;
}): Promise<Project> {
  ensureClient();
  const now = Date.now();
  const project: Project = {
    id: rid("prj"),
    name: input.name?.trim() || "Proyecto",
    client: input.client?.trim(),
    siteAddress: input.siteAddress?.trim(),
    partes: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.put(project);
  return project;
}

export async function getProject(id: string): Promise<Project | undefined> {
  ensureClient();
  return db.projects.get(id);
}

export async function removeProject(id: string): Promise<void> {
  ensureClient();
  await db.projects.delete(id);
}

/* ---------------------------- Partidas (cálculos) -------------------------- */

export type SavePartidaPayload = {
  title: string;
  kind: "electricidad" | "custom";
  inputs: unknown;
  outputs: unknown;
  materials: MaterialRow[];
};

/**
 * Inserta o actualiza una partida, buscándola por su TIPO (kind).
 * Útil para calculadoras que solo deben existir una vez por proyecto.
 */
export async function saveOrUpdatePartidaByKind(
  projectId: string,
  kind: "electricidad" | "custom",
  data: Omit<SavePartidaPayload, 'kind'>
): Promise<Partida | null> {
  ensureClient();
  const p = await db.projects.get(projectId);
  if (!p) return null;

  const now = Date.now();
  const idx = p.partes.findIndex((pt: Partida) => pt.kind === kind);

  const base = {
    kind,
    title: data.title?.trim() || "Cálculo",
    inputs: data.inputs ?? {},
    outputs: data.outputs ?? {},
    materials: toDBMaterials(Array.isArray(data.materials) ? data.materials : []),
  };

  let nextPartida: Partida;
  if (idx >= 0) {
    nextPartida = { ...p.partes[idx], ...base, updatedAt: now };
    p.partes[idx] = nextPartida;
  } else {
    nextPartida = { id: rid("pt"), ...base, createdAt: now, updatedAt: now };
    p.partes.push(nextPartida);
  }

  p.updatedAt = now;
  await db.projects.put(p);
  return nextPartida;
}

/** Elimina una partida por su ID único. La forma más segura. */
export async function removePartidaById(projectId: string, partidaId: string): Promise<boolean> {
  ensureClient();
  const p = await db.projects.get(projectId);
  if (!p) return false;

  const originalLength = p.partes.length;
  p.partes = p.partes.filter((pt: Partida) => pt.id !== partidaId);
  if (p.partes.length === originalLength) return false;

  p.updatedAt = Date.now();
  await db.projects.put(p);
  return true;
}

/** Lee una partida por su ID único. */
export async function getPartida(
  projectId: string,
  partidaId: string
): Promise<Partida | undefined> {
  ensureClient();
  const p = await db.projects.get(projectId);
  return p?.partes.find((pt: Partida) => pt.id === partidaId);
}

// Mantenemos esta función por si la usas para el sketch
export async function upsertSketch(
  projectId: string,
  sketch: { json?: unknown; pngDataUrl?: string }
): Promise<void> {
  const p = await getProject(projectId);
  if (!p) return;
  const next: Project = {
    ...p,
    sketch: { ...(p.sketch ?? {}), ...sketch },
    updatedAt: Date.now(),
  };
  await db.projects.put(next);
}