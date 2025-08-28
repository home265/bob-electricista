"use client";

import { useEffect, useState } from "react";

type Sistema = "monofasico_230" | "trifasico_400";

// Las props no cambian, el componente sigue recibiendo la misma información.
export default function AyudanteCaida(props: {
  sistema?: Sistema;
  caidaMaxPct?: number; 
  onCalcPct?: (pct: number) => void;
}) {
  // Toda la lógica de estado y cálculos se mantiene 100% igual.
  const [sistema, setSistema] = useState<Sistema>(props.sistema ?? "monofasico_230");
  const [I, setI] = useState<number | "">("");
  const [L, setL] = useState<number | "">("");
  const [vakm, setVakm] = useState<number | "">(""); 
  const [maxPct, setMaxPct] = useState<number | "">(props.caidaMaxPct ?? 3);

  useEffect(() => {
    if (props.sistema) setSistema(props.sistema);
    if (props.caidaMaxPct != null) setMaxPct(props.caidaMaxPct);
  }, [props.sistema, props.caidaMaxPct]);

  const V = sistema === "monofasico_230" ? 230 : 400;
  const K = sistema === "monofasico_230" ? 2 : Math.sqrt(3);

  const pct =
    I !== "" && L !== "" && vakm !== ""
      ? (100 * (K * Number(I) * (Number(L) / 1000) * Number(vakm))) / V
      : null;

  useEffect(() => {
    if (pct != null && props.onCalcPct) props.onCalcPct(pct);
  }, [pct, props.onCalcPct]); // Pequeña optimización en las dependencias del useEffect

  // A partir de aquí es donde aplicamos los cambios visuales.
  return (
    // Se elimina el contenedor principal con borde y el botón de mostrar/ocultar.
    // Ahora es una sección que se integra directamente en la tarjeta padre.
    <div className="space-y-3 pt-4 border-t border-border">
      <h3 className="font-medium text-sm">Ayudante de caída de tensión</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs opacity-80">Sistema</span>
            {/* ✅ Se aplica la clase .select para el estilo correcto */}
            <select className="select" value={sistema} onChange={(e) => setSistema(e.target.value as Sistema)}>
              <option value="monofasico_230">Monofásico 230 V</option>
              <option value="trifasico_400">Trifásico 400 V</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs opacity-80">Corriente (A)</span>
            {/* ✅ Se aplica la clase .input */}
            <input className="input" type="number" step="0.1" value={I}
                   onChange={(e) => setI(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs opacity-80">Longitud (m)</span>
            {/* ✅ Se aplica la clase .input */}
            <input className="input" type="number" step="0.1" value={L}
                   onChange={(e) => setL(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs opacity-80">V/A·km (tabla)</span>
            {/* ✅ Se aplica la clase .input */}
            <input className="input" type="number" step="0.1" value={vakm}
                   onChange={(e) => setVakm(e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="Ej: 3.8" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs opacity-80">ΔU máx (%)</span>
            {/* ✅ Se aplica la clase .input */}
            <input className="input" type="number" step="0.1" value={maxPct}
                   onChange={(e) => setMaxPct(e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="3 o 5" />
          </label>
        </div>
        {/* El resultado ahora usa el color de fondo --muted para integrarse mejor */}
        <div className="sm:col-span-2 md:col-span-5 rounded-lg p-3 text-center" style={{ background: "var(--muted)" }}>
              Resultado: <strong>{pct != null ? pct.toFixed(2) : "-"}%</strong>{" "}
              {pct != null && maxPct !== "" && (
                <span className="ml-2 text-sm">
                  {pct <= Number(maxPct) ? "✅ OK" : "⚠️ Supera Límite"}
                </span>
              )}
        </div>
    </div>
  );
}