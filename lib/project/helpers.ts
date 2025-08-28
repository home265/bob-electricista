export const now = (): number => Date.now();

export function uid(prefix = "id"): string {
  // usa UUID nativo cuando esté disponible
  // @ts-ignore
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}
