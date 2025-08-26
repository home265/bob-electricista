// lib/storage.ts
// Persistencia en LocalStorage para Proyectos y Partidas

import type { Project, Partida } from "@/lib/types";
import { newId } from "@/lib/id";

const KEY_PROJECTS = "inst_proyectos";
const KEY_CURRENT = "inst_current_project_id";

// ===== Helpers LocalStorage seguros (SSR-safe)
function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, val); } catch {}
}
function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch {}
}

// ===== Proyectos
export function listProjects(): Project[] {
  const raw = lsGet(KEY_PROJECTS);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Project[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveProjects(list: Project[]) {
  lsSet(KEY_PROJECTS, JSON.stringify(list));
}

export function createProject(name: string): Project {
  const p: Project = {
    id: newId("prj"),
    name: name.trim() || "Proyecto sin nombre",
    createdAt: new Date().toISOString(),
    partidas: [],
  };
  const all = listProjects();
  all.push(p);
  saveProjects(all);
  setCurrentProjectId(p.id);
  return p;
}

export function getProjectById(id: string | null | undefined): Project | null {
  if (!id) return null;
  const all = listProjects();
  return all.find(p => p.id === id) ?? null;
}

export function updateProject(p: Project): void {
  const all = listProjects();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) {
    all[idx] = p;
    saveProjects(all);
  }
}

export function deleteProject(id: string): void {
  const all = listProjects().filter(p => p.id !== id);
  saveProjects(all);
  const cur = getCurrentProjectId();
  if (cur === id) lsRemove(KEY_CURRENT);
}

// ===== Proyecto actual
export function getCurrentProjectId(): string | null {
  return lsGet(KEY_CURRENT);
}
export function setCurrentProjectId(id: string): void {
  lsSet(KEY_CURRENT, id);
}
export function getCurrentProject(): Project | null {
  const id = getCurrentProjectId();
  return getProjectById(id);
}

// ===== Partidas
export function addPartida(projectId: string, partida: Partida): void {
  const p = getProjectById(projectId);
  if (!p) return;
  p.partidas = [...(p.partidas ?? []), partida];
  updateProject(p);
}

export function removePartida(projectId: string, partidaId: string): void {
  const p = getProjectById(projectId);
  if (!p) return;
  p.partidas = (p.partidas ?? []).filter(pp => pp.id !== partidaId);
  updateProject(p);
}
