"use client";
import { db } from "../db";
import type { Project, Partida, MaterialRow } from "./types";
import { uid, now } from "./helpers";
import { aggregateMaterialsFromProject } from "./compute";

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export interface CreateProjectInput {
  name: string;
  client?: string;
  siteAddress?: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const project: Project = {
    id: uid("prj"),
    name: input.name,
    client: input.client,
    siteAddress: input.siteAddress,
    partes: [],
    createdAt: now(),
    updatedAt: now(),
  };
  await db.projects.add(project);
  return project;
}

export async function removeProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export async function updateProjectMeta(
  id: string,
  patch: Partial<Pick<Project, "name" | "client" | "siteAddress">>
): Promise<void> {
  const p = await getProject(id);
  if (!p) return;
  const next: Project = { ...p, ...patch, updatedAt: now() };
  await db.projects.put(next);
}

export interface SaveCalcInput {
  title: string;
  kind?: "electricidad" | "custom";
  inputs: unknown;
  outputs: unknown;
  materials: MaterialRow[];
}

/**
 * Inserta una nueva Partida (o actualiza si existe una con el mismo título).
 * Mantiene intacta la lógica de Electricidad: vos controlás inputs/outputs/materials.
 */
export async function saveOrUpdateCalculation(
  projectId: string,
  payload: SaveCalcInput
): Promise<Project | undefined> {
  const p = await getProject(projectId);
  if (!p) return;
  const nowTs = now();
  const existingIdx = p.partes.findIndex((pt) => pt.title === payload.title);
  const base: Partida = {
    id: uid("pt"),
    title: payload.title,
    kind: payload.kind ?? "electricidad",
    inputs: payload.inputs,
    outputs: payload.outputs,
    materials: payload.materials ?? [],
    createdAt: nowTs,
    updatedAt: nowTs,
  };
  if (existingIdx >= 0) {
    const prev = p.partes[existingIdx];
    p.partes[existingIdx] = {
      ...base,
      id: prev.id,
      createdAt: prev.createdAt,
      updatedAt: nowTs,
    };
  } else {
    p.partes.push(base);
  }
  const next: Project = { ...p, updatedAt: nowTs };
  await db.projects.put(next);
  return next;
}

export async function upsertSketch(
  projectId: string,
  sketch: { json?: unknown; pngDataUrl?: string }
): Promise<void> {
  const p = await getProject(projectId);
  if (!p) return;
  const next: Project = {
    ...p,
    sketch: { ...(p.sketch ?? {}), ...sketch },
    updatedAt: now(),
  };
  await db.projects.put(next);
}

export async function exportCSV(projectId: string): Promise<string> {
  const p = await getProject(projectId);
  if (!p) return "";
  const rows = aggregateMaterialsFromProject(p);
  const header = ["Item", "Cantidad", "Unidad"];
  const body = rows.map((r) => [r.label, String(r.qty), r.unit]);
  const csv = [header, ...body].map((arr) => arr.map(csvEscape).join(",")).join("\n");
  return csv;
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
