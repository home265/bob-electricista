"use client";

import { useEffect, useState } from "react";

type Sistema = "monofasico_230" | "trifasico_400";

export default function AyudanteCaida(props: {
  sistema?: Sistema;
  caidaMaxPct?: number; // ej 3 o 5
  onCalcPct?: (pct: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sistema, setSistema] = useState<Sistema>(props.sistema ?? "monofasico_230");
  const [I, setI] = useState<number | "">("");
  const [L, setL] = useState<number | "">("");
  const [vakm, setVakm] = useState<number | "">(""); // V/A·km de la sección elegida
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
  }, [pct, props]);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Ayudante de caída de tensión</h3>
        <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>
          {open ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <label className="flex flex-col">
            <span className="text-sm opacity-80">Sistema</span>
            <select className="px-3 py-2 rounded-xl" value={sistema} onChange={(e) => setSistema(e.target.value as Sistema)}>
              <option value="monofasico_230">Monofásico 230 V</option>
              <option value="trifasico_400">Trifásico 400 V</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Corriente (A)</span>
            <input className="px-3 py-2 rounded-xl" type="number" step="0.1" value={I}
                   onChange={(e) => setI(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Longitud (m)</span>
            <input className="px-3 py-2 rounded-xl" type="number" step="0.1" value={L}
                   onChange={(e) => setL(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">V/A·km (sección)</span>
            <input className="px-3 py-2 rounded-xl" type="number" step="0.1" value={vakm}
                   onChange={(e) => setVakm(e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="Ej: 3.8 (10 mm²)" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">ΔU máx. permitido (%)</span>
            <input className="px-3 py-2 rounded-xl" type="number" step="0.1" value={maxPct}
                   onChange={(e) => setMaxPct(e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="3 o 5" />
          </label>

          <div className="sm:col-span-2 md:col-span-5 rounded-lg p-3" style={{ background: "var(--muted)" }}>
            <div className="text-sm opacity-80">Resultado</div>
            <div className="mt-1">
              Caída estimada: <strong>{pct != null ? pct.toFixed(2) : "-"}</strong>%{" "}
              {pct != null && maxPct !== "" && (
                <span className="ml-2 text-sm">
                  {pct <= Number(maxPct) ? "✅ Dentro del límite" : "⚠️ Supera el límite"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
