// app/offline/page.tsx
export default function OfflinePage() {
  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Modo sin conexión</h1>
        <p className="opacity-80">
          Estás offline. Podés seguir consultando proyectos guardados en este dispositivo.
        </p>
      </header>

      <div className="card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Qué funciona sin internet</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Proyectos y partidas guardados (LocalStorage).</li>
          <li>Calculadoras que ya abriste antes (archivos en caché).</li>
          <li>Exportación a CSV/JSON y vista imprimible.</li>
        </ul>
        <p className="opacity-80 text-sm">
          Cuando recuperes conexión, recargá la página para sincronizar el contenido nuevo.
        </p>
      </div>

      <div className="flex gap-2">
        <a href="/" className="btn">Volver al inicio</a>
      </div>
    </section>
  );
}
