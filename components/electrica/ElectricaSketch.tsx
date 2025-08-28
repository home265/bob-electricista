"use client";
import { useEffect, useRef, useState } from "react";
import { saveElectricSketchFromCanvas, defaultElectricSketch } from "@/lib/electrica/drawing";
import { useParams } from "next/navigation";

type Point = { x: number; y: number };

export default function ElectricaSketch() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [last, setLast] = useState<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = globalThis.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(400 * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.font = "12px sans-serif";
      ctx.fillText("Boceto eléctrico (traçat simple)", 12, 18);
    }
  }, []);

  function getPos(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): Point {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    setDrawing(true);
    setLast(getPos(e));
  }
  function onMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!drawing || !last) return;
    const cur = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    setLast(cur);
  }
  function onUp() {
    setDrawing(false);
    setLast(null);
  }

  async function onSave() {
    if (!projectId || !canvasRef.current) return;
    await saveElectricSketchFromCanvas(projectId, canvasRef.current, defaultElectricSketch());
    alert("Boceto guardado en el proyecto.");
  }

  function onClear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3">
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] bg-white rounded-lg border"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-3 py-2 rounded-lg border">
          Guardar boceto
        </button>
        <button onClick={onClear} className="px-3 py-2 rounded-lg border">
          Limpiar
        </button>
      </div>
    </div>
  );
}
