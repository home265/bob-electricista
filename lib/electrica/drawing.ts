"use client";
import { upsertSketch } from "../project/storage";

/**
 * Devuelve un objeto JSON mínimo de boceto para guardar junto al proyecto.
 */
export function defaultElectricSketch(): unknown {
  return {
    version: 1,
    type: "electric",
    nodes: [],
    edges: [],
    meta: { createdAt: Date.now() },
  };
}

/**
 * Convierte un <canvas> en PNG (dataURL).
 */
export function canvasToPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

export async function saveElectricSketchFromCanvas(
  projectId: string,
  canvas: HTMLCanvasElement,
  json?: unknown
): Promise<void> {
  const pngDataUrl = canvasToPNG(canvas);
  await upsertSketch(projectId, { json: json ?? defaultElectricSketch(), pngDataUrl });
}
