// app/ayuda/page.tsx
export const metadata = { title: "Guía rápida • Instalación Eléctrica" };

export default function AyudaPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Guía rápida de uso</h1>
        <p className="opacity-80 text-sm">
          Paso a paso para crear un proyecto, cargar datos, entender el resultado y exportar la lista de materiales.
        </p>
        <div className="print:hidden">
          <a href="/" className="btn btn-ghost">← Volver al inicio</a>
        </div>
      </header>

      {/* Índice */}
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Contenido</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><a href="#proyecto">1) Crear o elegir proyecto</a></li>
          <li><a href="#alimentador">2) Alimentador / Acometida (opcional)</a></li>
          <li><a href="#circuitos">3) Circuitos: cómo cargar</a></li>
          <li><a href="#experto">4) Modo experto (sección manual)</a></li>
          <li><a href="#resultado">5) Resultado: qué significa “OK”</a></li>
          <li><a href="#bom">6) BOM / Exportar e imprimir</a></li>
          <li><a href="#tips">Tips rápidos y FAQ</a></li>
          <li><a href="#glosario">Glosario mínimo</a></li>
        </ul>
      </div>

      {/* 1) Proyecto */}
      <div id="proyecto" className="card p-4 space-y-2">
        <h2 className="font-semibold">1) Crear o elegir proyecto</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Al abrir la app, aparece el selector de proyecto.</li>
          <li>Escribí un nombre (ej: <em>Casa PB+PA / Pérez</em>) y tocá <strong>“Crear y usar”</strong>.
              También podés “Usar”, “Ver”, “Renombrar” o “Eliminar” proyectos existentes.</li>
          <li>Con un proyecto activo, abrí la tarjeta <strong>“Instalación Eléctrica”</strong>.</li>
        </ol>
      </div>

      {/* 2) Alimentador */}
      <div id="alimentador" className="card p-4 space-y-2">
        <h2 className="font-semibold">2) Alimentador / Acometida (opcional)</h2>
        <p className="text-sm opacity-90">
          Si tildás <strong>“Habilitar dimensionado”</strong> en “Alimentador”, la app calcula la sección desde el medidor
          hasta el tablero principal (o tablero donde conectan los circuitos).
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>Distancia (m):</strong> metros reales de cable.</li>
          <li><strong>Canalización:</strong> aérea, embutida, enterrada en caño o enterrada directa
              (si es “directa”, sugiere cable tipo Sintenax).</li>
          <li><strong>ΔU máx. (%):</strong> caída de tensión permitida (recomendado 2%).</li>
          <li><strong>Demanda global:</strong> factor 0..1 para estimar simultaneidad de toda la casa (típico 0.8).</li>
          <li><strong>cos φ global:</strong> si no sabés, dejá 0.9.</li>
        </ul>
        <p className="text-xs opacity-70">
          El resultado muestra sección, térmica general (IGA) y si la caída de tensión está dentro del límite.
        </p>
      </div>

      {/* 3) Circuitos */}
      <div id="circuitos" className="card p-4 space-y-2">
        <h2 className="font-semibold">3) Circuitos: cómo cargar</h2>
        <p className="text-sm">Cada circuito pide:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>Nombre:</strong> por ejemplo “Iluminación PB” o “Tomas Cocina”.</li>
          <li><strong>Tipo:</strong> define límites (caída máxima y sección mínima) acordes al uso.</li>
          <li><strong>Longitud (m):</strong> recorrido del cable hasta el punto más desfavorable (ida y vuelta lo calcula la app).</li>
          <li><strong>Canalización:</strong> embutida, a la vista, etc.</li>
          <li><strong>Modo de carga:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li><strong>Potencia directa (W):</strong> escribís los W totales del circuito. Opcional: <em>cos φ</em> y <em>Simultaneidad (0..1)</em>.</li>
              <li><strong>Por artefactos:</strong> elegís de un catálogo (lámparas, tomas, fijos) y cantidades; la app suma la potencia.</li>
            </ul>
          </li>
        </ul>
      </div>

      {/* 4) Experto */}
      <div id="experto" className="card p-4 space-y-2">
        <h2 className="font-semibold">4) Modo experto (sección manual)</h2>
        <p className="text-sm opacity-90">
          Por defecto, la app elige la <strong>sección automáticamente</strong> según ampacidad y caída de tensión.
          Si activás <strong>“Manual (experto)”</strong>, podés elegir la sección (mm²) y la app recalcula:
          corriente de diseño, caída de tensión y verifica si la térmica (MCB) está por debajo de la ampacidad (Iz).
        </p>
        <p className="text-xs opacity-70">
          Si no cumple, verás “OK: No” y el motivo (por ej. “Caída 4.2% &gt; 3%”). Ajustá sección, longitud o MCB.
        </p>
      </div>

      {/* 5) Resultado */}
      <div id="resultado" className="card p-4 space-y-2">
        <h2 className="font-semibold">5) Resultado: qué significa “OK”</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>Ib (A):</strong> corriente calculada por la potencia y el cos φ.</li>
          <li><strong>Sección / Iz:</strong> sección propuesta y su ampacidad admisible.</li>
          <li><strong>MCB:</strong> térmica sugerida para ese circuito.</li>
          <li><strong>ΔU (%):</strong> caída de tensión estimada en el punto más desfavorable.</li>
          <li><strong>OK:</strong> “Sí” si <em>ΔU ≤ ΔU máx</em> y <em>MCB ≤ Iz</em>. Si no, muestra el motivo.</li>
        </ul>
      </div>

      {/* 6) BOM / Export */}
      <div id="bom" className="card p-4 space-y-2">
        <h2 className="font-semibold">6) BOM / Exportar e imprimir</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          <li>Cuando el cálculo te sirva, tocá <strong>“Agregar al proyecto”</strong>. Eso guarda la partida y su BOM.</li>
          <li>Entrá al proyecto (botón <em>Ver</em>) para ver el listado de partidas.</li>
          <li>Abrí <strong>“Vista imprimible”</strong>: <code>/proyecto/&lt;id&gt;/export</code>.</li>
          <li>Usá el botón <strong>“Imprimir / PDF”</strong> para generar un PDF o imprimir.</li>
        </ol>
        <p className="text-xs opacity-70">
          La vista imprimible también muestra un BOM agregado (suma materiales de todas las partidas).
        </p>
      </div>

      {/* Tips */}
      <div id="tips" className="card p-4 space-y-2">
        <h2 className="font-semibold">Tips rápidos y FAQ</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>No sé el cos φ:</strong> dejá el valor por defecto (0.9). Para iluminación LED, 0.9–0.95 suele estar bien.</li>
          <li><strong>¿Longitud ida y vuelta?</strong> Cargá la distancia “en línea” (hasta el punto más lejano). La app calcula la caída considerando el retorno.</li>
          <li><strong>¿Puedo mezclar artefactos y W directos?</strong> Sí, la potencia directa se suma a la de artefactos.</li>
          <li><strong>Me da “OK: No”:</strong> subí sección, bajá MCB o disminuí longitud / potencia. Probá con la sección automática.</li>
          <li><strong>Enterrada directa:</strong> elegí “Enterrado directo (Sintenax)” en Alimentador para que el BOM use el cable correcto.</li>
        </ul>
      </div>

      {/* Glosario */}
      <div id="glosario" className="card p-4 space-y-2">
        <h2 className="font-semibold">Glosario mínimo</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>MCB:</strong> interruptor termomagnético (térmica).</li>
          <li><strong>RCD / ID:</strong> interruptor diferencial (30 mA en terminal; selectivo aguas arriba si corresponde).</li>
          <li><strong>Iz:</strong> ampacidad admisible del cable según método de instalación.</li>
          <li><strong>ΔU:</strong> caída de tensión en porcentaje.</li>
          <li><strong>cos φ (pf):</strong> factor de potencia (0..1).</li>
          <li><strong>Sistema:</strong> monofásico 230 V o trifásico 400 V.</li>
        </ul>
        <p className="text-xs opacity-70">
          Esta herramienta orienta el dimensionado según criterios habituales. Para obras reguladas, verificá siempre con la normativa vigente
          y el criterio del profesional responsable.
        </p>
      </div>
    </section>
  );
}
